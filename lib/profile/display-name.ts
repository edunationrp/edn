/**
 * Affichage nom profil — utilise first_name/last_name ou découpe full_name.
 */
export function splitFullName(fullName: string | null | undefined) {
  const trimmed = fullName?.trim() ?? ''
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

export type ProfileNameRow = {
  id: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
}

export function resolveProfileName(profile: ProfileNameRow) {
  const first = profile.first_name?.trim()
  const last = profile.last_name?.trim()
  if (first || last) {
    return {
      first_name: first ?? '',
      last_name: last ?? '',
      display_name: [first, last].filter(Boolean).join(' ').trim() || 'Utilisateur',
    }
  }
  const split = splitFullName(profile.full_name)
  return {
    first_name: split.firstName,
    last_name: split.lastName,
    display_name: profile.full_name?.trim() || 'Utilisateur',
  }
}

export function resolveProfileNames<T extends ProfileNameRow>(profiles: T[] | null | undefined) {
  return (profiles ?? []).map(p => ({
    ...p,
    ...resolveProfileName(p),
  }))
}
