import type { UserRole } from '@/types/roles'

/** Registre élèves (/dashboard/students) — réservé au personnel administratif, pas aux professeurs. */
const STUDENT_REGISTRY_ROLES = new Set<UserRole>([
  'SUPER_ADMIN_EDUNATION',
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'CENSEUR',
  'SECRETAIRE',
  'CONSEILLER_EDUCATION',
  'INTENDANT',
  'SURVEILLANT_GENERAL',
])

export function canAccessStudentRegistry(role: string | null | undefined): boolean {
  if (!role) return false
  return STUDENT_REGISTRY_ROLES.has(role as UserRole)
}
