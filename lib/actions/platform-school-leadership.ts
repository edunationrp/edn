'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAppUrl } from '@/lib/env/public'
import { sendStaffInviteEmail } from '@/lib/email/send'
import { ROLE_LABELS } from '@/types/roles'
import { requirePlatformAdmin } from '@/lib/platform/access'
import { deleteStaffSchoolAccountIfEmpty } from '@/lib/staff/membership-auth'
import {
  countActiveSchoolLeaders,
  hasPendingProviseurInvitation,
  isRemovableLeadershipRole,
  isSchoolLeadershipRole,
  syncSchoolLeadershipOwnership,
} from '@/lib/platform/school-leadership'

type ActionError = { error: string }
type ActionOk = { success: true }

async function requireAdminDb() {
  const access = await requirePlatformAdmin()
  if ('error' in access) return access

  try {
    return { admin: createAdminClient(), actorId: access.user.id }
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }
}

function revalidateSchoolPaths(schoolId: string) {
  revalidatePath('/dashboard/platform/schools')
  revalidatePath(`/dashboard/platform/schools/${schoolId}`)
}

async function writePlatformAuditLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: {
    actorId: string
    schoolId: string
    action: string
    entityType: string
    entityId?: string | null
    oldData?: Record<string, unknown> | null
    newData?: Record<string, unknown> | null
  },
) {
  await admin.from('audit_logs').insert({
    actor_id: params.actorId,
    school_id: params.schoolId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
  })
}

export async function invitePlatformSchoolProviseur(data: {
  schoolId: string
  invitedEmail: string
  invitedName?: string
  sendEmail?: boolean
}): Promise<
  | { success: true; inviteUrl: string; emailSent?: boolean; emailWarning?: string }
  | ActionError
> {
  const result = await requireAdminDb()
  if ('error' in result) return result

  const email = data.invitedEmail.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { error: 'Adresse email invalide.' }
  }

  const invitedName = data.invitedName?.trim() || null
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolRaw } = await (result.admin as any)
    .from('schools')
    .select('id, name')
    .eq('id', data.schoolId)
    .limit(1)

  const school = (schoolRaw as Array<{ id: string; name: string }> | null)?.[0]
  if (!school) return { error: 'Établissement introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error } = await (result.admin as any)
    .from('staff_invitations')
    .insert({
      school_id: data.schoolId,
      role_code: 'PROVISEUR',
      invited_by: result.actorId,
      invited_email: email,
      invited_name: invitedName,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      metadata: { source: 'platform_superadmin' },
    })
    .select('id, token')
    .single()

  if (error || !invitation) {
    return { error: error?.message ?? 'Impossible de créer l\'invitation.' }
  }

  const inviteUrl = `${resolveAppUrl()}/join/staff/${invitation.token}`
  let emailSent: boolean | undefined
  let emailWarning: string | undefined

  if (data.sendEmail !== false) {
    const emailResult = await sendStaffInviteEmail(email, {
      inviterName: 'EduNation — Super Admin',
      schoolName: school.name,
      roleLabel: ROLE_LABELS.PROVISEUR,
      inviteUrl,
    })

    if (!emailResult.ok) {
      emailSent = false
      emailWarning = 'error' in emailResult ? emailResult.error : 'Envoi email impossible.'
    } else if ('skipped' in emailResult && emailResult.skipped) {
      emailSent = false
      emailWarning = 'Email non configuré. Copiez le lien d\'invitation manuellement.'
    } else {
      emailSent = true
    }
  }

  await writePlatformAuditLog(result.admin, {
    actorId: result.actorId,
    schoolId: data.schoolId,
    action: 'platform.invite_proviseur',
    entityType: 'staff_invitation',
    entityId: invitation.id,
    newData: { invitedEmail: email, invitedName },
  })

  revalidateSchoolPaths(data.schoolId)
  return { success: true, inviteUrl, emailSent, emailWarning }
}

export async function promotePlatformSchoolProviseur(data: {
  schoolId: string
  userId: string
}): Promise<ActionOk | ActionError> {
  const result = await requireAdminDb()
  if ('error' in result) return result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberRaw } = await (result.admin as any)
    .from('user_school_roles')
    .select('id, user_id, role_code, is_active, profiles(full_name, email)')
    .eq('school_id', data.schoolId)
    .eq('user_id', data.userId)
    .eq('is_active', true)
    .limit(1)

  const member = (memberRaw as Array<{
    id: string
    user_id: string
    role_code: string
    profiles: { full_name: string | null; email: string | null } | null
  }> | null)?.[0]

  if (!member) {
    return { error: 'Ce membre n\'a pas d\'accès actif à cet établissement.' }
  }

  if (isSchoolLeadershipRole(member.role_code)) {
    return { error: 'Cette personne est déjà directrice de l\'établissement.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingLeadershipRaw } = await (result.admin as any)
    .from('user_school_roles')
    .select('id')
    .eq('school_id', data.schoolId)
    .eq('user_id', data.userId)
    .eq('role_code', 'PROVISEUR')
    .limit(1)

  if ((existingLeadershipRaw as unknown[] | null)?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (result.admin as any)
      .from('user_school_roles')
      .update({ is_active: true })
      .eq('school_id', data.schoolId)
      .eq('user_id', data.userId)
      .eq('role_code', 'PROVISEUR')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (result.admin as any)
      .from('user_school_roles')
      .insert({
        user_id: data.userId,
        school_id: data.schoolId,
        role_code: 'PROVISEUR',
        is_active: true,
      })

    if (insertError) {
      return { error: insertError.message }
    }
  }

  const ownership = await syncSchoolLeadershipOwnership(result.admin, data.schoolId, data.userId)
  if (ownership.error) return { error: ownership.error }

  await writePlatformAuditLog(result.admin, {
    actorId: result.actorId,
    schoolId: data.schoolId,
    action: 'platform.promote_proviseur',
    entityType: 'user_school_roles',
    entityId: data.userId,
    newData: {
      userId: data.userId,
      fullName: member.profiles?.full_name ?? null,
      email: member.profiles?.email ?? null,
    },
  })

  revalidateSchoolPaths(data.schoolId)
  return { success: true }
}

export async function removePlatformSchoolProviseur(data: {
  schoolId: string
  userId: string
  deleteAccount?: boolean
}): Promise<ActionOk | (ActionError & { code?: string })> {
  const result = await requireAdminDb()
  if ('error' in result) return result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rolesRaw } = await (result.admin as any)
    .from('user_school_roles')
    .select('id, role_code')
    .eq('school_id', data.schoolId)
    .eq('user_id', data.userId)
    .eq('is_active', true)

  const roles = (rolesRaw as Array<{ id: string; role_code: string }> | null) ?? []
  const leadershipRoles = roles.filter(row => isRemovableLeadershipRole(row.role_code))

  if (!leadershipRoles.length) {
    return { error: 'Cet utilisateur n\'est pas proviseur ou fondateur de cet établissement.' }
  }

  const remainingLeaders = await countActiveSchoolLeaders(result.admin, data.schoolId, data.userId)
  const pendingInvite = await hasPendingProviseurInvitation(result.admin, data.schoolId)

  if (remainingLeaders === 0 && !pendingInvite) {
    return {
      error:
        'Impossible de retirer le dernier directeur sans successeur. Invitez ou promouvez d\'abord un remplaçant.',
      code: 'NO_SUCCESSOR',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolRaw } = await (result.admin as any)
    .from('schools')
    .select('id, founder_id, organization_id')
    .eq('id', data.schoolId)
    .limit(1)

  const school = (schoolRaw as Array<{
    id: string
    founder_id: string | null
    organization_id: string | null
  }> | null)?.[0]

  if (!school) return { error: 'Établissement introuvable.' }

  const roleIds = leadershipRoles.map(row => row.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (result.admin as any)
    .from('user_school_roles')
    .delete()
    .in('id', roleIds)

  if (deleteError) return { error: deleteError.message }

  if (school.founder_id === data.userId) {
    const { data: nextLeaderRaw } = await result.admin
      .from('user_school_roles')
      .select('user_id')
      .eq('school_id', data.schoolId)
      .eq('is_active', true)
      .in('role_code', ['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT'])
      .neq('user_id', data.userId)
      .limit(1)

    const nextLeaderId =
      (nextLeaderRaw as Array<{ user_id: string }> | null)?.[0]?.user_id ?? null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (result.admin as any)
      .from('schools')
      .update({ founder_id: nextLeaderId })
      .eq('id', data.schoolId)

    if (school.organization_id && nextLeaderId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (result.admin as any)
        .from('organizations')
        .update({ founder_id: nextLeaderId })
        .eq('id', school.organization_id)
        .eq('founder_id', data.userId)
    }
  }

  let accountDeleted = false
  if (data.deleteAccount) {
    const purge = await deleteStaffSchoolAccountIfEmpty(result.admin, data.userId, data.schoolId)
    if (purge.error) return { error: purge.error }
    accountDeleted = purge.deleted
  }

  await writePlatformAuditLog(result.admin, {
    actorId: result.actorId,
    schoolId: data.schoolId,
    action: 'platform.remove_proviseur',
    entityType: 'user',
    entityId: data.userId,
    oldData: { roleCodes: leadershipRoles.map(row => row.role_code) },
    newData: { deleteAccount: Boolean(data.deleteAccount), accountDeleted },
  })

  revalidateSchoolPaths(data.schoolId)
  return { success: true }
}

export async function transferPlatformSchoolLeadership(data: {
  schoolId: string
  outgoingUserId: string
  incomingUserId: string
  deleteOutgoingAccount?: boolean
}): Promise<ActionOk | ActionError> {
  if (data.outgoingUserId === data.incomingUserId) {
    return { error: 'Le successeur doit être une personne différente.' }
  }

  const promote = await promotePlatformSchoolProviseur({
    schoolId: data.schoolId,
    userId: data.incomingUserId,
  })
  if ('error' in promote) return promote

  const remove = await removePlatformSchoolProviseur({
    schoolId: data.schoolId,
    userId: data.outgoingUserId,
    deleteAccount: data.deleteOutgoingAccount,
  })
  if ('error' in remove) return remove

  return { success: true }
}
