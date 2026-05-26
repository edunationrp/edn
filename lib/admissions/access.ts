import type { UserRole } from '@/types/roles'
import { hasPermission } from '@/types/permissions'

const PROVISEUR_ROLES: UserRole[] = ['PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR']

export function isSecretaryRole(role: string) {
  return role === 'SECRETAIRE'
}

export function isProviseurRole(role: string) {
  return PROVISEUR_ROLES.includes(role as UserRole) || hasPermission(role, 'students:validate')
}

/** File de travail secrétariat — réservée à la secrétaire. */
export function canAccessSecretaryAdmissionQueue(role: string) {
  return isSecretaryRole(role)
}

/** Décisions d'admission — proviseur / direction, pas la secrétaire. */
export function canAccessProviseurAdmissionValidation(role: string) {
  return isProviseurRole(role) && !isSecretaryRole(role)
}
