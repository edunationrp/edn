/** Normalise les codes rôle pour la navigation sidebar. */
export function resolveNavRole(role: string) {
  if (role === 'FONDATEUR') return 'PROVISEUR'
  if (role === 'PARENT_ILLETRE') return 'PARENT'
  // Conserver les entrées sidebar dédiées si elles existent
  if (role === 'DIRECTEUR_ADJOINT' || role === 'CONSEILLER_EDUCATION' || role === 'SURVEILLANT_GENERAL') {
    return role
  }
  return role
}
