import {
  applyTeacherAssignmentsFromInvitation,
  parseTeacherAssignmentsFromMetadata,
} from '@/lib/staff/invitation-assignments'
import {
  buildStaffMembershipAuthEmail,
  normalizeContactEmail,
} from '@/lib/auth/staff-membership-email'
import {
  findStaffUserIdAtSchool,
  isStaffContactEmailUsedAtSchool,
} from '@/lib/staff/membership-auth'

type StaffInvitationRow = {
  id: string
  school_id: string
  role_code: string
  metadata: unknown
}

export type StaffRegistrationInput = {
  contactEmail: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

async function getAuthUserIdByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.rpc('get_auth_user_id_by_email', {
    p_email: email.trim().toLowerCase(),
  })
  if (error || !data) return null
  return String(data)
}

async function finalizeStaffSchoolMembership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: {
    userId: string
    invitation: StaffInvitationRow
    contactEmail: string
    fullName: string
    firstName: string
    lastName: string
    phone?: string
    password: string
  },
): Promise<{ error?: string }> {
  const { userId, invitation, contactEmail, fullName, phone, password } = params

  const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
    password,
    user_metadata: {
      full_name: fullName,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: phone?.trim(),
      default_role: invitation.role_code,
      contact_email: contactEmail,
    },
  })
  if (passwordError) {
    return { error: passwordError.message }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any).from('profiles').upsert({
    id: userId,
    email: contactEmail,
    full_name: fullName,
    phone: phone?.trim() || null,
    preferred_language: 'fr',
    default_role: invitation.role_code,
  })
  if (profileError) return { error: profileError.message }

  const { data: existingRoleRaw } = await admin
    .from('user_school_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', invitation.school_id)
    .eq('role_code', invitation.role_code)
    .limit(1)

  if (!(existingRoleRaw as unknown[] | null)?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: roleError } = await (admin as any).from('user_school_roles').insert({
      user_id: userId,
      school_id: invitation.school_id,
      role_code: invitation.role_code,
      is_active: true,
    })
    if (roleError) return { error: roleError.message }
  }

  if (invitation.role_code === 'PROFESSEUR') {
    const assignments = parseTeacherAssignmentsFromMetadata(invitation.metadata)
    const applied = await applyTeacherAssignmentsFromInvitation(admin, {
      schoolId: invitation.school_id,
      teacherId: userId,
      assignments,
    })
    if (applied.error) return { error: applied.error }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: inviteError } = await (admin as any)
    .from('staff_invitations')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', invitation.id)

  if (inviteError) return { error: inviteError.message }

  return {}
}

/**
 * Inscription depuis invitation : crée ou reprend un compte Auth propre à l'établissement.
 * Gère les tentatives interrompues (auth créé sans rôle école).
 */
export async function registerStaffFromInvitationCore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  invitation: StaffInvitationRow,
  input: StaffRegistrationInput,
): Promise<
  | { success: true; userId: string; contactEmail: string; schoolId: string; roleCode: string }
  | { error: string }
> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const contactEmail = normalizeContactEmail(input.contactEmail)

  if (!firstName || !lastName) {
    return { error: 'Le prénom et le nom sont requis.' }
  }

  const existingAtSchool = await findStaffUserIdAtSchool(admin, contactEmail, invitation.school_id)
  if (existingAtSchool) {
    return {
      error:
        'Un compte existe déjà pour cet établissement avec cet email. Connectez-vous avec le mot de passe de cet établissement.',
    }
  }

  if (await isStaffContactEmailUsedAtSchool(admin, invitation.school_id, contactEmail)) {
    return { error: 'Cet email est déjà utilisé dans cet établissement.' }
  }

  const authEmail = buildStaffMembershipAuthEmail(contactEmail, invitation.school_id)

  let userId: string | null = null
  let createdNewAuthUser = false

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
      contact_email: contactEmail,
    },
  })

  if (authData?.user) {
    userId = authData.user.id
    createdNewAuthUser = true
  } else if (signUpError && /already|registered|exists|duplicate/i.test(signUpError.message)) {
    userId = await getAuthUserIdByEmail(admin, authEmail)

    if (!userId) {
      const legacyUserId = await getAuthUserIdByEmail(admin, contactEmail)
      if (legacyUserId) {
        const { data: rolesRaw } = await admin
          .from('user_school_roles')
          .select('school_id')
          .eq('user_id', legacyUserId)

        const schoolIds = ((rolesRaw ?? []) as Array<{ school_id: string }>).map(row => row.school_id)

        if (schoolIds.includes(invitation.school_id)) {
          return {
            error:
              'Un compte existe déjà pour cet établissement avec cet email. Connectez-vous avec le mot de passe de cet établissement.',
          }
        }

        if (schoolIds.length === 0) {
          userId = legacyUserId
          await admin.auth.admin.updateUserById(userId, {
            email: authEmail,
            email_confirm: true,
          })
        }
      }
    }

    if (!userId) {
      return {
        error:
          'Cet email est déjà utilisé sur la plateforme pour un autre établissement. Utilisez le formulaire ci-dessous pour créer un accès dédié à cet établissement — si l\'erreur persiste, contactez le secrétariat.',
      }
    }

    const stillAtSchool = await findStaffUserIdAtSchool(admin, contactEmail, invitation.school_id)
    if (stillAtSchool) {
      return {
        error:
          'Un compte existe déjà pour cet établissement avec cet email. Connectez-vous avec le mot de passe de cet établissement.',
      }
    }
  } else {
    return { error: signUpError?.message ?? 'Création du compte impossible.' }
  }

  const finalized = await finalizeStaffSchoolMembership(admin, {
    userId,
    invitation,
    contactEmail,
    fullName,
    firstName,
    lastName,
    phone: input.phone,
    password: input.password,
  })

  if (finalized.error) {
    if (createdNewAuthUser) {
      await admin.auth.admin.deleteUser(userId)
    }
    return { error: finalized.error }
  }

  return {
    success: true,
    userId,
    contactEmail,
    schoolId: invitation.school_id,
    roleCode: invitation.role_code,
  }
}

export async function staffAccountExistsAtSchool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  schoolId: string,
  contactEmail: string,
): Promise<boolean> {
  const userId = await findStaffUserIdAtSchool(admin, normalizeContactEmail(contactEmail), schoolId)
  return Boolean(userId)
}
