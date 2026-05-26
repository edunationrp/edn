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

export function canConfigureOfficialTuition(roleCode: string) {
  return PROVISEUR_ROLES.has(roleCode)
}

export function canEncashPayments(roleCode: string) {
  return ENCASHMENT_ROLES.has(roleCode)
}

export function canManageExtraFeeTemplates(roleCode: string) {
  return PROVISEUR_ROLES.has(roleCode)
}
