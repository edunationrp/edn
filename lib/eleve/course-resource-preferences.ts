const VIEWED_KEY = 'edn-course-viewed'
const FAVORITES_KEY = 'edn-course-favorites'

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids))
}

export function getViewedResourceIds(): Set<string> {
  return new Set(readIds(VIEWED_KEY))
}

export function markResourceViewed(id: string) {
  const ids = readIds(VIEWED_KEY)
  if (!ids.includes(id)) {
    writeIds(VIEWED_KEY, [...ids, id])
  }
}

export function getFavoriteResourceIds(): Set<string> {
  return new Set(readIds(FAVORITES_KEY))
}

export function toggleFavoriteResource(id: string): boolean {
  const ids = readIds(FAVORITES_KEY)
  const has = ids.includes(id)
  if (has) {
    writeIds(FAVORITES_KEY, ids.filter(x => x !== id))
    return false
  }
  writeIds(FAVORITES_KEY, [...ids, id])
  return true
}

export function isRecentResource(publishedAt: string | null, days = 7): boolean {
  if (!publishedAt) return false
  const diff = Date.now() - new Date(publishedAt).getTime()
  return diff >= 0 && diff < days * 24 * 60 * 60 * 1000
}
