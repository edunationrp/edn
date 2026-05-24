import { ADMIN_ROLES, STAFF_ROLES, type UserRole } from '@/types/roles'

/** Rôles exclus de la liste des destinataires (élèves et parents). */
export const NON_STAFF_MESSAGING_ROLES = ['ELEVE', 'PARENT', 'PARENT_ILLETRE'] as const

export const MESSAGING_STAFF_ROLES: UserRole[] = [...ADMIN_ROLES, ...STAFF_ROLES]

export function isMessagingStaffRole(roleCode: string): boolean {
  return !NON_STAFF_MESSAGING_ROLES.includes(
    roleCode as (typeof NON_STAFF_MESSAGING_ROLES)[number]
  )
}

export function orderConversationParticipants(
  userA: string,
  userB: string
): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA]
}
