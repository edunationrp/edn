export type UserRole =
  | 'SUPER_ADMIN_EDUNATION'
  | 'FONDATEUR'
  | 'PROVISEUR'
  | 'CENSEUR'
  | 'CONSEILLER'
  | 'INTENDANT'
  | 'SECRETAIRE'
  | 'VIE_SCOLAIRE'
  | 'PROFESSEUR'
  | 'PARENT'
  | 'ELEVE'
  | 'PARENT_ILLETRE'

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN_EDUNATION: 'Super Admin EduNation',
  FONDATEUR: 'Fondateur',
  PROVISEUR: 'Proviseur / Directeur',
  CENSEUR: 'Censeur',
  CONSEILLER: 'Conseiller',
  INTENDANT: 'Intendant',
  SECRETAIRE: 'Secrétaire',
  VIE_SCOLAIRE: 'Vie Scolaire',
  PROFESSEUR: 'Professeur',
  PARENT: 'Parent',
  ELEVE: 'Élève',
  PARENT_ILLETRE: 'Parent (Interface Simplifiée)',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN_EDUNATION: 'bg-purple-100 text-purple-800',
  FONDATEUR: 'bg-blue-100 text-blue-800',
  PROVISEUR: 'bg-green-100 text-green-800',
  CENSEUR: 'bg-teal-100 text-teal-800',
  CONSEILLER: 'bg-cyan-100 text-cyan-800',
  INTENDANT: 'bg-orange-100 text-orange-800',
  SECRETAIRE: 'bg-yellow-100 text-yellow-800',
  VIE_SCOLAIRE: 'bg-indigo-100 text-indigo-800',
  PROFESSEUR: 'bg-sky-100 text-sky-800',
  PARENT: 'bg-rose-100 text-rose-800',
  ELEVE: 'bg-emerald-100 text-emerald-800',
  PARENT_ILLETRE: 'bg-pink-100 text-pink-800',
}

export const STAFF_ROLES: UserRole[] = [
  'CENSEUR',
  'CONSEILLER',
  'INTENDANT',
  'SECRETAIRE',
  'VIE_SCOLAIRE',
  'PROFESSEUR',
]

export const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN_EDUNATION',
  'FONDATEUR',
  'PROVISEUR',
]

export const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN_EDUNATION',
  'FONDATEUR',
  'PROVISEUR',
  'CENSEUR',
  'CONSEILLER',
  'INTENDANT',
  'SECRETAIRE',
  'VIE_SCOLAIRE',
  'PROFESSEUR',
  'PARENT',
  'ELEVE',
  'PARENT_ILLETRE',
]
