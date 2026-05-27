'use server'

import { revalidatePath } from 'next/cache'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { resolveAppUrl } from '@/lib/env/public'
import { sendStaffInviteEmail, type SendEmailResult } from '@/lib/email/send'
import { hasPermission, isSchoolFullAuthority } from '@/types/permissions'
import { normalizeRole, ROLE_LABELS, STAFF_ROLES } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import { INVITABLE_ROLES } from '@/lib/permissions/catalog'
import {
  applyTeacherAssignmentsFromInvitation,
  buildInvitationMetadata,
  enrichTeacherAssignments,
  parseTeacherAssignmentsFromMetadata,
  validateTeacherInviteAssignments,
  type TeacherInviteAssignmentInput,
} from '@/lib/staff/invitation-assignments'
import {
  cleanupTeacherSchoolMembership,
  isRemovableStaffRole,
} from '@/lib/staff/member-removal'
import { buildStaffMembershipAuthEmail } from '@/lib/auth/staff-membership-email'
import {
  deleteStaffSchoolAccountIfEmpty,
  isStaffContactEmailUsedAtSchool,
} from '@/lib/staff/membership-auth'

export type StaffInviteActionResult =
  | {
      success: true
      inviteUrl: string
      emailSent?: boolean
      emailWarning?: string
      reused?: boolean
    }
  | { error: string }

type StaffAccessError = { error: string }
type StaffAccessOk = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
  ctx: NonNullable<Awaited<ReturnType<typeof getUserSchoolContext>>>
  role: UserRole
  schoolId: string
}

type AdminDbError = { error: string }
type AdminDbOk = { admin: ReturnType<typeof createAdminClient> }

async function requireStaffAccess(
  minPermission: 'staff:read' | 'staff:invite' | 'staff:activate' | 'staff:deactivate'
): Promise<StaffAccessError | StaffAccessOk> {
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

function requireAdminDb(): AdminDbError | AdminDbOk {
  const admin = getAdminOrClient()
  if (!admin) {
    return {
      error:
        'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY). Les invitations nécessitent la clé service Supabase.',
    } as const
  }
  return { admin }
}

function summarizeEmailResult(result: SendEmailResult): { sent: boolean; warning?: string } {
  if (!result.ok) {
    return {
      sent: false,
      warning: 'error' in result ? result.error : 'Envoi email impossible.',
    }
  }
  if ('skipped' in result && result.skipped) {
    return {
      sent: false,
      warning:
        'Email non configuré (RESEND_API_KEY). Copiez le lien d\'invitation et envoyez-le manuellement.',
    }
  }
  return { sent: true }
}

async function fetchInviteEmailContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  userId: string
) {
  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .limit(1)

  const { data: inviterRaw } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .limit(1)

  return {
    schoolName: (schoolRaw as Array<{ name: string }> | null)?.[0]?.name ?? 'Votre établissement',
    inviterName:
      (inviterRaw as Array<{ full_name: string | null }> | null)?.[0]?.full_name ?? 'Le directeur',
  }
}

export async function createStaffInvitation(data: {
  roleCode: string
  invitedEmail?: string
  invitedName?: string
  sendEmail?: boolean
  teacherAssignments?: TeacherInviteAssignmentInput[]
}): Promise<StaffInviteActionResult> {
  const base = await requireStaffAccess('staff:invite')
  if ('error' in base) return { error: base.error }

  if (!INVITABLE_ROLES.includes(data.roleCode as UserRole)) {
    return { error: 'Rôle non invitable.' }
  }

  if (data.roleCode === 'PROFESSEUR') {
    const validation = await validateTeacherInviteAssignments(
      base.supabase,
      base.schoolId,
      data.teacherAssignments ?? []
    )
    if (validation.error) return { error: validation.error }
  } else if (data.teacherAssignments?.length) {
    return { error: 'Les affectations ne s\'appliquent qu\'aux invitations professeur.' }
  }

  const adminResult = requireAdminDb()
  if ('error' in adminResult) return { error: adminResult.error }
  const db = adminResult.admin

  const invitedEmail = data.invitedEmail?.trim().toLowerCase() || null
  const invitedName = data.invitedName?.trim() || null
  const metadata = data.roleCode === 'PROFESSEUR'
    ? buildInvitationMetadata(data.teacherAssignments)
    : {}

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Réutiliser une invitation en attente pour le même email
  if (invitedEmail) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingRaw } = await (db as any)
      .from('staff_invitations')
      .select('id, token, status, expires_at')
      .eq('school_id', base.schoolId)
      .ilike('invited_email', invitedEmail)
      .eq('status', 'pending')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const existing = existingRaw as {
      id: string
      token: string
      expires_at: string
    } | null

    if (existing && new Date(existing.expires_at) > new Date()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from('staff_invitations')
        .update({
          role_code: data.roleCode,
          invited_name: invitedName,
          expires_at: expiresAt.toISOString(),
          invited_by: base.user.id,
          metadata,
        })
        .eq('id', existing.id)

      const inviteUrl = `${resolveAppUrl()}/join/staff/${existing.token}`
      let emailSent: boolean | undefined
      let emailWarning: string | undefined

      if (data.sendEmail && invitedEmail) {
        const ctx = await fetchInviteEmailContext(base.supabase, base.schoolId, base.user.id)
        const emailResult = await sendStaffInviteEmail(invitedEmail, {
          inviterName: ctx.inviterName,
          schoolName: ctx.schoolName,
          roleLabel: ROLE_LABELS[data.roleCode as UserRole] ?? data.roleCode,
          inviteUrl,
        })
        const summary = summarizeEmailResult(emailResult)
        emailSent = summary.sent
        emailWarning = summary.warning
      }

      revalidatePath('/dashboard/staff/roles-permissions')
      revalidatePath('/dashboard/staff/invitations')
      return {
        success: true,
        inviteUrl,
        reused: true,
        emailSent,
        emailWarning,
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error } = await (db as any)
    .from('staff_invitations')
    .insert({
      school_id: base.schoolId,
      role_code: data.roleCode,
      invited_by: base.user.id,
      invited_email: invitedEmail,
      invited_name: invitedName,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      metadata,
    })
    .select('id, token')
    .single()

  if (error || !invitation) {
    return { error: error?.message ?? 'Impossible de créer l\'invitation.' }
  }

  const inviteUrl = `${resolveAppUrl()}/join/staff/${invitation.token}`
  let emailSent: boolean | undefined
  let emailWarning: string | undefined

  if (data.sendEmail && invitedEmail) {
    const ctx = await fetchInviteEmailContext(base.supabase, base.schoolId, base.user.id)
    const emailResult = await sendStaffInviteEmail(invitedEmail, {
      inviterName: ctx.inviterName,
      schoolName: ctx.schoolName,
      roleLabel: ROLE_LABELS[data.roleCode as UserRole] ?? data.roleCode,
      inviteUrl,
    })
    const summary = summarizeEmailResult(emailResult)
    emailSent = summary.sent
    emailWarning = summary.warning
  }

  revalidatePath('/dashboard/staff/roles-permissions')
  revalidatePath('/dashboard/staff/invitations')
  return { success: true, inviteUrl, emailSent, emailWarning }
}

export async function cancelStaffInvitation(invitationId: string) {
  const base = await requireStaffAccess('staff:invite')
  if ('error' in base) return base

  const adminResult = requireAdminDb()
  if ('error' in adminResult) return adminResult

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminResult.admin as any)
    .from('staff_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('school_id', base.schoolId)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/staff/roles-permissions')
  return { success: true }
}

export async function resendStaffInvitationEmail(
  invitationId: string
): Promise<StaffInviteActionResult> {
  const base = await requireStaffAccess('staff:invite')
  if ('error' in base) return { error: base.error }

  const adminResult = requireAdminDb()
  if ('error' in adminResult) return { error: adminResult.error }
  const db = adminResult.admin

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRaw } = await (db as any)
    .from('staff_invitations')
    .select('id, token, role_code, invited_email, invited_name, status, expires_at')
    .eq('id', invitationId)
    .eq('school_id', base.schoolId)
    .limit(1)

  const invitation = (inviteRaw as Array<{
    id: string
    token: string
    role_code: string
    invited_email: string | null
    status: string
    expires_at: string
  }> | null)?.[0]

  if (!invitation) return { error: 'Invitation introuvable.' }
  if (invitation.status !== 'pending') return { error: 'Cette invitation n\'est plus active.' }
  if (new Date(invitation.expires_at) < new Date()) return { error: 'Invitation expirée.' }
  if (!invitation.invited_email?.trim()) {
    return { error: 'Aucun email associé à cette invitation.' }
  }

  const inviteUrl = `${resolveAppUrl()}/join/staff/${invitation.token}`
  const ctx = await fetchInviteEmailContext(base.supabase, base.schoolId, base.user.id)

  const emailResult = await sendStaffInviteEmail(invitation.invited_email.trim(), {
    inviterName: ctx.inviterName,
    schoolName: ctx.schoolName,
    roleLabel: ROLE_LABELS[invitation.role_code as UserRole] ?? invitation.role_code,
    inviteUrl,
  })

  const summary = summarizeEmailResult(emailResult)
  if (!summary.sent) {
    return {
      success: true,
      inviteUrl,
      emailSent: false,
      emailWarning: summary.warning ?? 'Envoi email impossible. Copiez le lien d\'invitation.',
    }
  }

  return { success: true, inviteUrl, emailSent: true }
}

function getWritableDb(base: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  return getAdminOrClient() ?? base.supabase
}

export async function setStaffMemberActive(memberRoleId: string, isActive: boolean) {
  const base = await requireStaffAccess(isActive ? 'staff:activate' : 'staff:deactivate')
  if ('error' in base) return base

  const db = getWritableDb(base)

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

export async function removeStaffMemberFromSchool(memberRoleId: string) {
  const base = await requireStaffAccess('staff:deactivate')
  if ('error' in base) return base

  if (!isSchoolFullAuthority(base.role)) {
    return { error: 'Seul le proviseur peut retirer un membre de l\'établissement.' as const }
  }

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

  if (!isRemovableStaffRole(member.role_code)) {
    return { error: 'Impossible de retirer un directeur ou fondateur.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRolesRaw } = await (db as any)
    .from('user_school_roles')
    .select('id')
    .eq('user_id', member.user_id)

  const userRoleIds = ((userRolesRaw ?? []) as Array<{ id: string }>).map(row => row.id)
  const isLastRoleAtSchool =
    userRoleIds.filter(id => id === memberRoleId).length === 1 &&
    userRoleIds.length === 1

  if (isLastRoleAtSchool && !admin) {
    return {
      error:
        'La suppression définitive du compte dans cet établissement nécessite SUPABASE_SERVICE_ROLE_KEY (clé service Supabase).',
    }
  }

  if (member.user_id === base.user.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: otherRolesRaw } = await (db as any)
      .from('user_school_roles')
      .select('id')
      .eq('user_id', base.user.id)
      .eq('school_id', base.schoolId)
      .neq('id', memberRoleId)
      .eq('is_active', true)

    const otherRoles = (otherRolesRaw as Array<{ id: string }> | null) ?? []
    if (otherRoles.length === 0) {
      return { error: 'Vous ne pouvez pas retirer votre seul accès à l\'établissement.' }
    }
  }

  if (normalizeRole(member.role_code) === 'PROFESSEUR') {
    const cleanup = await cleanupTeacherSchoolMembership(db, base.schoolId, member.user_id)
    if (cleanup.error) {
      if (!admin) {
        return {
          error:
            'Impossible de retirer les affectations du professeur. Appliquez la migration 020_staff_remove_complete.sql (ou configurez SUPABASE_SERVICE_ROLE_KEY).',
        }
      }
      return { error: cleanup.error }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from('teacher_assignments')
      .update({ is_active: false })
      .eq('school_id', base.schoolId)
      .eq('teacher_id', member.user_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from('classes')
      .update({ main_teacher_id: null })
      .eq('school_id', base.schoolId)
      .eq('main_teacher_id', member.user_id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, count } = await (db as any)
    .from('user_school_roles')
    .delete({ count: 'exact' })
    .eq('id', memberRoleId)
    .eq('school_id', base.schoolId)

  if (error) {
    if (!admin && /policy|permission|42501|row-level security/i.test(error.message)) {
      return {
        error:
          'Suppression refusée par la base de données. Appliquez la migration Supabase 018_staff_remove_rls.sql (ou configurez SUPABASE_SERVICE_ROLE_KEY).',
      }
    }
    return { error: error.message }
  }

  if (count === 0) {
    return { error: 'Membre introuvable ou déjà retiré.' }
  }

  let accountDeleted = false
  if (admin) {
    const purge = await deleteStaffSchoolAccountIfEmpty(admin, member.user_id, base.schoolId)
    if (purge.error) {
      return { error: purge.error }
    }
    accountDeleted = purge.deleted
  }

  revalidatePath('/dashboard/staff/roles-permissions')
  revalidatePath('/dashboard/staff')
  return { success: true as const, accountDeleted }
}

export async function updateStaffMemberRole(memberRoleId: string, newRoleCode: string) {
  const base = await requireStaffAccess('staff:activate')
  if ('error' in base) return base

  if (!INVITABLE_ROLES.includes(newRoleCode as UserRole)) {
    return { error: 'Rôle cible invalide.' }
  }

  const db = getWritableDb(base)

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

  const adminResult = requireAdminDb()
  if ('error' in adminResult) return adminResult
  const admin = adminResult.admin

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRaw } = await (admin as any)
    .from('staff_invitations')
    .select('id, school_id, role_code, status, expires_at, used_at, invited_email, metadata')
    .eq('token', token)
    .limit(1)

  const invitation = (inviteRaw as Array<{
    id: string
    school_id: string
    role_code: string
    status: string
    expires_at: string
    used_at: string | null
    invited_email: string | null
    metadata: unknown
  }> | null)?.[0]

  if (!invitation) return { error: 'Invitation introuvable ou invalide.' }
  if (invitation.status !== 'pending') return { error: 'Cette invitation n\'est plus valide.' }
  if (invitation.used_at) return { error: 'Invitation déjà utilisée.' }
  if (new Date(invitation.expires_at) < new Date()) {
    await (admin as any).from('staff_invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return { error: 'Invitation expirée. Demandez un nouveau lien au directeur.' }
  }

  const { data: profileRaw } = await admin
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .limit(1)

  const contactEmail = (
    profileRaw as Array<{ email: string | null }> | null
  )?.[0]?.email?.toLowerCase()

  if (
    invitation.invited_email &&
    contactEmail &&
    invitation.invited_email.toLowerCase() !== contactEmail
  ) {
    return {
      error: `Cette invitation est réservée à ${invitation.invited_email}. Créez un compte dédié à cet établissement via le formulaire d'inscription.`,
    }
  }

  const { data: membershipAtSchoolRaw } = await admin
    .from('user_school_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', invitation.school_id)
    .limit(1)

  if (!(membershipAtSchoolRaw as unknown[] | null)?.length) {
    return {
      error:
        'Pour rejoindre un nouvel établissement avec le même email, créez un compte dédié (mot de passe propre à cet établissement) via le formulaire ci-dessous.',
    }
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

  if (invitation.role_code === 'PROFESSEUR') {
    const assignments = parseTeacherAssignmentsFromMetadata(invitation.metadata)
    const applied = await applyTeacherAssignmentsFromInvitation(admin, {
      schoolId: invitation.school_id,
      teacherId: user.id,
      assignments,
    })
    if (applied.error) return { error: applied.error }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('staff_invitations')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  const { data: profileRaw } = await admin
    .from('profiles')
    .select('default_role')
    .eq('id', user.id)
    .limit(1)

  const currentDefault = (profileRaw as Array<{ default_role: string | null }> | null)?.[0]?.default_role
  if (!currentDefault || currentDefault === 'ELEVE' || currentDefault === 'PARENT') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('profiles')
      .update({ default_role: invitation.role_code })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard')
  return { success: true as const, roleCode: invitation.role_code }
}

export async function getInvitationPreview(token: string) {
  const adminResult = requireAdminDb()
  if ('error' in adminResult) return adminResult
  const admin = adminResult.admin

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRaw } = await (admin as any)
    .from('staff_invitations')
    .select(`
      id, role_code, status, expires_at, invited_name, invited_email, metadata,
      school_id,
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
    invited_email: string | null
    metadata: unknown
    school_id: string
    schools: { name: string } | null
  }> | null)?.[0]

  if (!row) return { error: 'Invitation introuvable.' }

  const teacherAssignments = row.role_code === 'PROFESSEUR'
    ? await enrichTeacherAssignments(
        admin,
        row.school_id,
        parseTeacherAssignmentsFromMetadata(row.metadata)
      )
    : []

  return {
    success: true as const,
    preview: {
      schoolId: row.school_id,
      schoolName: row.schools?.name ?? 'Établissement',
      roleCode: row.role_code,
      roleLabel: ROLE_LABELS[row.role_code as UserRole] ?? row.role_code,
      status: row.status,
      expiresAt: row.expires_at,
      invitedName: row.invited_name,
      invitedEmail: row.invited_email,
      isExpired: new Date(row.expires_at) < new Date(),
      teacherAssignments,
    },
  }
}

export async function registerStaffFromInvitation(input: {
  token: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}) {
  const adminResult = requireAdminDb()
  if ('error' in adminResult) return adminResult
  const admin = adminResult.admin

  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  if (!firstName || !lastName) {
    return { error: 'Le prénom et le nom sont requis.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRaw } = await (admin as any)
    .from('staff_invitations')
    .select('id, school_id, role_code, status, expires_at, invited_email, metadata')
    .eq('token', input.token)
    .limit(1)

  const invitation = (inviteRaw as Array<{
    id: string
    school_id: string
    role_code: string
    status: string
    expires_at: string
    invited_email: string | null
    metadata: unknown
  }> | null)?.[0]

  if (!invitation) return { error: 'Invitation invalide.' }
  if (invitation.status !== 'pending') return { error: 'Invitation déjà utilisée ou annulée.' }
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'Invitation expirée.' }
  }

  const email = input.email.trim().toLowerCase()
  if (invitation.invited_email && invitation.invited_email.toLowerCase() !== email) {
    return { error: 'Cette invitation est réservée à une autre adresse email.' }
  }

  if (await isStaffContactEmailUsedAtSchool(admin, invitation.school_id, email)) {
    return { error: 'Cet email est déjà utilisé dans cet établissement.' }
  }

  const authEmail = buildStaffMembershipAuthEmail(email, invitation.school_id)

  const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
    email: authEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      phone: input.phone?.trim(),
      default_role: invitation.role_code,
      contact_email: email,
    },
  })

  if (signUpError || !authData.user) {
    const msg = signUpError?.message ?? 'Création du compte impossible.'
    if (/already|registered|exists|duplicate/i.test(msg)) {
      return {
        error: 'Un compte existe déjà pour cet établissement avec cet email. Connectez-vous avec le mot de passe de cet établissement.',
      }
    }
    return { error: msg }
  }

  const userId = authData.user.id

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (admin as any).from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      phone: input.phone?.trim() || null,
      preferred_language: 'fr',
      default_role: invitation.role_code,
    })

    if (profileError) throw new Error(profileError.message)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: roleError } = await (admin as any).from('user_school_roles').insert({
      user_id: userId,
      school_id: invitation.school_id,
      role_code: invitation.role_code,
      is_active: true,
    })

    if (roleError) throw new Error(roleError.message)

    if (invitation.role_code === 'PROFESSEUR') {
      const assignments = parseTeacherAssignmentsFromMetadata(invitation.metadata)
      const applied = await applyTeacherAssignmentsFromInvitation(admin, {
        schoolId: invitation.school_id,
        teacherId: userId,
        assignments,
      })
      if (applied.error) throw new Error(applied.error)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: inviteError } = await (admin as any)
      .from('staff_invitations')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (inviteError) throw new Error(inviteError.message)
  } catch (err) {
    await admin.auth.admin.deleteUser(userId)
    return { error: err instanceof Error ? err.message : 'Inscription interrompue.' }
  }

  revalidatePath('/dashboard')
  return { success: true as const, email, schoolId: invitation.school_id, roleCode: invitation.role_code }
}
