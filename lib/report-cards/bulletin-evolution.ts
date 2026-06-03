import {
  BULLETIN_TERM_ORDER,
  bulletinTermSortIndex,
  normalizeBulletinTermCode,
  type BulletinTermCode,
} from '@/lib/report-cards/bulletin-term'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export type BulletinEvolutionInput = {
  id: string
  term: string | null
  average: number | null
  schoolYearName: string | null
  snapshot: BulletinSnapshot
}

export type BulletinEvolutionPoint = {
  term: BulletinTermCode
  label: string
  bulletinId: string | null
  average: number | null
  deltaFromPrevious: number | null
}

export function resolveBulletinSchoolYear(item: BulletinEvolutionInput): string | null {
  return item.schoolYearName ?? item.snapshot.schoolYear ?? null
}

export function pickPrimarySchoolYear(bulletins: BulletinEvolutionInput[]): string | null {
  const counts = new Map<string, number>()
  for (const bulletin of bulletins) {
    const year = resolveBulletinSchoolYear(bulletin)
    if (!year) continue
    counts.set(year, (counts.get(year) ?? 0) + 1)
  }
  let best: string | null = null
  let max = 0
  for (const [year, count] of counts) {
    if (count > max) {
      max = count
      best = year
    }
  }
  return best
}

export function listSchoolYears(bulletins: BulletinEvolutionInput[]): string[] {
  const years = new Set<string>()
  for (const bulletin of bulletins) {
    const year = resolveBulletinSchoolYear(bulletin)
    if (year) years.add(year)
  }
  return [...years].sort((a, b) => b.localeCompare(a, 'fr'))
}

export function buildBulletinEvolution(
  bulletins: BulletinEvolutionInput[],
  schoolYear: string | null,
): BulletinEvolutionPoint[] {
  const filtered = schoolYear
    ? bulletins.filter(b => resolveBulletinSchoolYear(b) === schoolYear)
    : bulletins

  const byTerm = new Map<BulletinTermCode, BulletinEvolutionInput>()
  for (const bulletin of filtered) {
    const code = normalizeBulletinTermCode(bulletin.term, bulletin.snapshot)
    if (!code) continue
    const existing = byTerm.get(code)
    if (!existing) {
      byTerm.set(code, bulletin)
      continue
    }
    const existingDate = existing.snapshot.generatedAt
    const nextDate = bulletin.snapshot.generatedAt
    if (nextDate > existingDate) byTerm.set(code, bulletin)
  }

  let previous: number | null = null
  return BULLETIN_TERM_ORDER.map(term => {
    const match = byTerm.get(term)
    const average =
      match?.average ?? match?.snapshot.generalAverage ?? null
    const delta =
      average !== null && previous !== null
        ? Math.round((average - previous) * 100) / 100
        : null
    if (average !== null) previous = average

    return {
      term,
      label: match?.snapshot.termLabel ?? `Trimestre ${term.slice(1)}`,
      bulletinId: match?.id ?? null,
      average,
      deltaFromPrevious: delta,
    }
  })
}

export function sortBulletinsForDisplay<T extends BulletinEvolutionInput>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const yearA = resolveBulletinSchoolYear(a) ?? ''
    const yearB = resolveBulletinSchoolYear(b) ?? ''
    if (yearA !== yearB) return yearB.localeCompare(yearA, 'fr')
    const termA = normalizeBulletinTermCode(a.term, a.snapshot)
    const termB = normalizeBulletinTermCode(b.term, b.snapshot)
    const idxA = termA ? bulletinTermSortIndex(termA) : -1
    const idxB = termB ? bulletinTermSortIndex(termB) : -1
    return idxB - idxA
  })
}
