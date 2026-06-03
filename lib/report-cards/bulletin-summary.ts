import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export function gradeToneClass(value: number | null): string {
  if (value === null) return 'text-slate-400'
  if (value < 10) return 'text-red-600'
  if (value >= 14) return 'text-emerald-700'
  return 'text-[#1B3A6B]'
}

export function formatRankLabel(rank: number | null, classSize: number | null): string | null {
  if (rank === null || classSize === null) return null
  const suffix = rank === 1 ? 'er' : 'ème'
  return `${rank}${suffix} sur ${classSize}`
}

export type BulletinCardSummary = {
  title: string
  schoolYear: string | null
  generalAverage: number | null
  rankLabel: string | null
  appreciation: string
  bestSubject: string | null
  focusSubject: string | null
}

export function buildBulletinCardSummary(
  period: string | null,
  term: string | null,
  schoolYearName: string | null,
  snapshot: BulletinSnapshot,
  average: number | null,
  rank: number | null,
  classSize: number | null,
): BulletinCardSummary {
  const title = snapshot.termLabel || period || term || 'Bulletin'
  const subjectsWithAvg = snapshot.subjects.filter(s => s.studentAverage !== null)

  let best: { name: string; avg: number } | null = null
  let weakest: { name: string; avg: number } | null = null

  for (const subject of subjectsWithAvg) {
    const avg = subject.studentAverage!
    if (!best || avg > best.avg) best = { name: subject.name, avg }
    if (!weakest || avg < weakest.avg) weakest = { name: subject.name, avg }
  }

  const displayAverage = average ?? snapshot.generalAverage

  return {
    title,
    schoolYear: schoolYearName ?? snapshot.schoolYear,
    generalAverage: displayAverage,
    rankLabel: formatRankLabel(rank ?? snapshot.generalRank, classSize ?? snapshot.student.classSize),
    appreciation: snapshot.generalAppreciation || '—',
    bestSubject: best ? `${best.name} (${best.avg.toFixed(1)}/20)` : null,
    focusSubject:
      weakest && weakest.avg < 10 ? `${weakest.name} (${weakest.avg.toFixed(1)}/20)` : null,
  }
}
