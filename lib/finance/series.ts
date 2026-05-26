const SERIES_LEVELS = new Set(['2nde', '1ère', '1ere', 'Tle', 'Terminale'])

export function parseSeriesFromClassName(className: string, levelName: string): string {
  const fromColumn = className.match(/\(([A-Za-z]+)\)/)
  if (fromColumn) return fromColumn[1].toUpperCase()

  const normalizedLevel = levelName.trim()
  if (!SERIES_LEVELS.has(normalizedLevel) && !normalizedLevel.toLowerCase().includes('term')) {
    return ''
  }

  const withoutLevel = className.replace(new RegExp(levelName, 'i'), '').trim()
  const letterMatch = withoutLevel.match(/\b([A-D])\b/i)
  if (letterMatch) return letterMatch[1].toUpperCase()

  const words = className.trim().split(/\s+/)
  const last = words[words.length - 1]
  if (/^[A-D]$/i.test(last)) return last.toUpperCase()

  return ''
}

export function formatTuitionLabel(levelName: string, series: string) {
  if (!series) return levelName
  return `${levelName} — Série ${series}`
}

export const COMMON_SERIES = ['', 'A', 'C', 'D'] as const
