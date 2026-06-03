/**
 * Identité d'une section (lettre / filière) pour faire correspondre 6ème A → 5ème A.
 */

export function extractSectionKey(className: string, levelName: string | null): string {
  const name = className.trim()
  if (levelName?.trim()) {
    const prefix = levelName.trim()
    const lowerName = name.toLowerCase()
    const lowerPrefix = prefix.toLowerCase()
    if (lowerName.startsWith(lowerPrefix)) {
      const rest = name.slice(prefix.length).trim().replace(/^[\s-]+/, '')
      if (rest) return rest
    }
  }

  const trailing = name.match(/\s+([A-Za-z0-9]+(?:\s*\([^)]+\))?)\s*$/)
  if (trailing?.[1]) return trailing[1].trim()

  return ''
}

export function buildClassNameForLevel(levelName: string, sectionKey: string, series?: string | null): string {
  const base = sectionKey.trim() || 'A'
  const withSeries = series?.trim() ? `${base} (${series.trim()})` : base
  return `${levelName.trim()} ${withSeries}`.trim()
}

export function suggestNextSchoolYearLabel(currentName: string): string {
  const match = currentName.match(/(\d{4})\s*[-–—]\s*(\d{4})/)
  if (!match) {
    const y = new Date().getFullYear() + 1
    return `${y} — ${y + 1}`
  }
  const start = Number(match[1]) + 1
  const end = Number(match[2]) + 1
  return `${start} — ${end}`
}

export function sectionKeysMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
