const PROVISEUR_ROLES = new Set([
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'SUPER_ADMIN_EDUNATION',
])

const ENCASHMENT_ROLES = new Set([
  'INTENDANT',
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'SECRETAIRE',
  'SUPER_ADMIN_EDUNATION',
])

/** Personnel autorisé à consulter la synthèse finance de l'établissement. */
const SCHOOL_FINANCE_ROLES = new Set([
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'INTENDANT',
  'SECRETAIRE',
  'CENSEUR',
  'SUPER_ADMIN_EDUNATION',
])

const PERSONAL_FINANCE_ROLES = new Set(['PARENT', 'PARENT_ILLETRE'])

export function canAccessSchoolFinanceDashboard(roleCode: string) {
  return SCHOOL_FINANCE_ROLES.has(roleCode)
}

/** Accès à au moins une page finance (tableau établissement ou paiements personnels). */
export function canViewFinancePages(roleCode: string) {
  return canAccessSchoolFinanceDashboard(roleCode) || PERSONAL_FINANCE_ROLES.has(roleCode)
}

export function isPersonalFinanceRole(roleCode: string) {
  return PERSONAL_FINANCE_ROLES.has(roleCode)
}

export function canConfigureOfficialTuition(roleCode: string) {
  return PROVISEUR_ROLES.has(roleCode)
}

export function canEncashPayments(roleCode: string) {
  return ENCASHMENT_ROLES.has(roleCode)
}

export function canManageExtraFeeTemplates(roleCode: string) {
  return PROVISEUR_ROLES.has(roleCode)
}
