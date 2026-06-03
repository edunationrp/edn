/** Lien vers les ressources cours filtrées par nom de matière. */
export function coursResourcesHref(subjectName: string): string {
  return `/eleve/cours?matiere=${encodeURIComponent(subjectName)}`
}
