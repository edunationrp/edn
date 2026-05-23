'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { resolveAppUrl } from '@/lib/env/public'
import { sendStaffInviteEmail } from '@/lib/email/send'
import { hasPermission } from '@/types/permissions'
import { ROLE_LABELS, STAFF_ROLES } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import { INVITABLE_ROLES } from '@/lib/permissions/catalog'

type ActionResult = { success: true; inviteUrl?: string } | { error: string }

async function requireStaffAccess(minPermission: 'staff:read' | 'staff:invite' | 'staff:activate' | 'staff:deactivate') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, minPermission)) {
    return { error: 'Vous n\'avez pas les droits pour cette action.' as const }
  }

  return { supabase, user, ctx, role, schoolId: ctx.school_id }
}

function getAdminOrClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

export async function createStaffInvitation(data: {
  roleCode: string
  invitedEmail?: string
  invitedName?: string
  sendEmail?: boolean
}) {
  const base = await requireStaffAccess('staff:invite')
  if ('error' in base) return base

  if (!INVITABLE_ROLES.includes(data.roleCode as UserRole)) {
    return { error: 'Rôle non invitable.' }
  }

  const admin = getAdminOrClient()
  if (!admin) return { error: 'Service d\'invitation indisponible.' }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error } = await (admin as any)
    .from('staff_invitations')
    .insert({
      school_id: base.schoolId,
      role_code: data.roleCode,
      invited_by: base.user.id,
      invited_email: data.invitedEmail?.trim() || null,
      invited_name: data.invitedName?.trim() || null,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    })
    .select('id, token')
    .single()

  if (error || !invitation) return { error: error?.message ?? 'Impossible de créer l\'invitation.' }

  const inviteUrl = `${resolveAppUrl()}/join/staff/${invitation.token}`

  if (data.sendEmail && data.invitedEmail?.trim()) {
    const { data: schoolRaw } = await base.supabase
      .from('schools')
      .select('name')
      .eq('id', base.schoolId)
      .limit(1)

    const schoolName = (schoolRaw as Array<{ name: string }> | null)?.[0]?.name ?? 'Votre établissement'
    const { data: inviterRaw } = await base.supabase
      .from('profiles')
      .select('full_name')
      .eq('id', base.user.id)
      .limit(1)

    const inviterName = (inviterRaw as Array<{ full_name: string | null }> | null)?.[0]?.full_name ?? 'Le directeur'

    await sendStaffInviteEmail(data.invitedEmail.trim(), {
      inviterName,
      schoolName,
      roleLabel: ROLE_LABELS[data.roleCode as UserRole] ?? data.roleCode,
      inviteUrl,
    })
  }

  revalidatePath('/dashboard/staff/roles-permissions')
  revalidatePath('/dashboard/staff/invitations')
  return { success: true, inviteUrl }
}

export async function cancelStaffInvitation(invitationId: string) {
  const base = await requireStaffAccess('staff:invite')
  if ('error' in base) return base

  const admin = getAdminOrClient()
  if (!admin) return { error: 'Service indisponible.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('staff_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('school_id', base.schoolId)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/staff/roles-permissions')
  return { success: true }
}

export async function setStaffMemberActive(memberRoleId: string, isActive: boolean) {
  const base = await requireStaffAccess(isActive ? 'staff:activate' : 'staff:deactivate')
  if ('error' in base) return base

  const admin = getAdminOrClient()
  const db = admin ?? base.supabase

  const { data: memberRaw } = await db
    .from('user_school_roles')
    .select('id, user_id, role_code, school_id')
    .eq('id', memberRoleId)
    .eq('school_id', base.schoolId)
    .limit(1)

  const member = (memberRaw as Array<{ id: string; user_id: string; role_code: string }> | null)?.[0]
  if (!member) return { error: 'Membre introuvable.' }

  if (member.user_id === base.user.id) {
    return { error: 'Vous ne pouvez pas modifier votre propre accès.' }
  }

  if (!STAFF_ROLES.includes(member.role_code as UserRole) && member.role_code !== 'PROVISEUR') {
    return { error: 'Ce rôle ne peut pas être modifié ici.' }
  }

  if (member.role_code === 'PROVISEUR' || member.role_code === 'FONDATEUR') {
    return { error: 'Impossible de désactiver un directeur ou fondateur.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('user_school_roles')
    .update({ is_active: isActive })
    .eq('id', memberRoleId)
    .eq('school_id', base.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/staff/roles-permissions')
  revalidatePath('/dashboard/staff')
  return { success: true }
}

export async function updateStaffMemberRole(memberRoleId: string, newRoleCode: string) {
  const base = await requireStaffAccess('staff:activate')
  if ('error' in base) return base

  if (!INVITABLE_ROLES.includes(newRoleCode as UserRole)) {
    return { error: 'Rôle cible invalide.' }
  }

  const admin = getAdminOrClient()
  const db = admin ?? base.supabase

  const { data: memberRaw } = await db
    .from('user_school_roles')
    .select('id, user_id, role_code')
    .eq('id', memberRoleId)
    .eq('school_id', base.schoolId)
    .limit(1)

  const member = (memberRaw as Array<{ id: string; user_id: string; role_code: string }> | null)?.[0]
  if (!member) return { error: 'Membre introuvable.' }

  if (member.user_id === base.user.id) {
    return { error: 'Vous ne pouvez pas modifier votre propre rôle.' }
  }

  if (member.role_code === 'PROVISEUR' || member.role_code === 'FONDATEUR') {
    return { error: 'Impossible de modifier le rôle d\'un directeur.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('user_school_roles')
    .update({ role_code: newRoleCode })
    .eq('id', memberRoleId)
    .eq('school_id', base.schoolId)

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { error: 'Cet utilisateur possède déjà ce rôle dans l\'établissement.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/staff/roles-permissions')
  revalidatePath('/dashboard/staff')
  return { success: true }
}

export async function acceptStaffInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Connectez-vous pour accepter l\'invitation.' }

  const admin = getAdminOrClient()
  if (!admin) return { error: 'Service indisponible.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRaw } = await (admin as any)
    .from('staff_invitations')
    .select('id, school_id, role_code, status, expires_at, used_at')
    .eq('token', token)
    .limit(1)

  const invitation = (inviteRaw as Array<{
    id: string
    school_id: string
    role_code: string
    status: string
    expires_at: string
    used_at: string | null
  }> | null)?.[0]

  if (!invitation) return { error: 'Invitation introuvable ou invalide.' }
  if (invitation.status !== 'pending') return { error: 'Cette invitation n\'est plus valide.' }
  if (invitation.used_at) return { error: 'Invitation déjà utilisée.' }
  if (new Date(invitation.expires_at) < new Date()) {
    await (admin as any).from('staff_invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return { error: 'Invitation expirée. Demandez un nouveau lien au directeur.' }
  }

  const { data: existingRaw } = await admin
    .from('user_school_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', invitation.school_id)
    .eq('role_code', invitation.role_code)
    .limit(1)

  if ((existingRaw as unknown[] | null)?.length) {
    return { error: 'Vous avez déjà ce rôle dans cet établissement.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: roleError } = await (admin as any)
    .from('user_school_roles')
    .insert({
      user_id: user.id,
      school_id: invitation.school_id,
      role_code: invitation.role_code,
      is_active: true,
    })

  if (roleError) return { error: roleError.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('staff_invitations')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('profiles')
    .update({ default_role: invitation.role_code })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getInvitationPreview(token: string) {
  const admin = getAdminOrClient()
  if (!admin) return { error: 'Service indisponible.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRaw } = await (admin as any)
    .from('staff_invitations')
    .select(`
      id, role_code, status, expires_at, invited_name,
      schools ( name )
    `)
    .eq('token', token)
    .limit(1)

  const row = (inviteRaw as Array<{
    id: string
    role_code: string
    status: string
    expires_at: string
    invited_name: string | null
    schools: { name: string } | null
  }> | null)?.[0]

  if (!row) return { error: 'Invitation introuvable.' }

  return {
    success: true as const,
    preview: {
      schoolName: row.schools?.name ?? 'Établissement',
      roleCode: row.role_code,
      roleLabel: ROLE_LABELS[row.role_code as UserRole] ?? row.role_code,
      status: row.status,
      expiresAt: row.expires_at,
      invitedName: row.invited_name,
      isExpired: new Date(row.expires_at) < new Date(),
    },
  }
}
