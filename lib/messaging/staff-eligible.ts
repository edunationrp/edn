import { ADMIN_ROLES, STAFF_ROLES, normalizeRole, type UserRole } from '@/types/roles'

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

const STAFF_ROLE_PRIORITY: Record<string, number> = {
  SUPER_ADMIN_EDUNATION: 0,
  FONDATEUR: 1,
  PROVISEUR: 2,
  DIRECTEUR_ADJOINT: 3,
  CENSEUR: 4,
  SECRETAIRE: 5,
  INTENDANT: 6,
  VIE_SCOLAIRE: 7,
  SURVEILLANT_GENERAL: 8,
  CONSEILLER: 9,
  CONSEILLER_EDUCATION: 10,
  PROFESSEUR: 11,
}

function staffRolePriority(roleCode: string) {
  return STAFF_ROLE_PRIORITY[roleCode] ?? STAFF_ROLE_PRIORITY[normalizeRole(roleCode)] ?? 99
}

/** Déduplique par id utilisateur (plusieurs rôles actifs possibles). */
export function dedupeStaffRecipients<
  T extends { id: string; role_code: string | null },
>(items: T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of items) {
    const existing = byId.get(item.id)
    if (
      !existing ||
      staffRolePriority(item.role_code ?? '') < staffRolePriority(existing.role_code ?? '')
    ) {
      byId.set(item.id, item)
    }
  }
  return Array.from(byId.values())
}
