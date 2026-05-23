/** Normalise les codes rôle pour la navigation sidebar. */
export function resolveNavRole(role: string) {
  if (role === 'FONDATEUR') return 'PROVISEUR'
  if (role === 'PARENT_ILLETRE') return 'PARENT'
  return role
}
