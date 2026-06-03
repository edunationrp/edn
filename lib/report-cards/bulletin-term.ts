import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export const BULLETIN_TERM_ORDER = ['T1', 'T2', 'T3'] as const
export type BulletinTermCode = (typeof BULLETIN_TERM_ORDER)[number]

export const BULLETIN_TERM_SHORT: Record<BulletinTermCode, string> = {
  T1: 'T1',
  T2: 'T2',
  T3: 'T3',
}

export function normalizeBulletinTermCode(
  term: string | null,
  snapshot?: Pick<BulletinSnapshot, 'termCode' | 'termLabel'> | null,
): BulletinTermCode | null {
  const raw = (snapshot?.termCode ?? term ?? '').trim().toUpperCase()
  if (raw === 'T1' || raw === 'T2' || raw === 'T3') return raw
  const label = (snapshot?.termLabel ?? term ?? '').toUpperCase()
  if (label.includes('1') || label.includes('PREMIER') || label.includes('1ER')) return 'T1'
  if (label.includes('2') || label.includes('DEUX') || label.includes('2ÈME') || label.includes('2EME'))
    return 'T2'
  if (label.includes('3') || label.includes('TROIS') || label.includes('3ÈME') || label.includes('3EME'))
    return 'T3'
  return null
}

export function notesTermHref(termCode: BulletinTermCode): string {
  return `/eleve/notes#notes-term-${termCode}`
}

export function bulletinTermSortIndex(term: BulletinTermCode): number {
  return BULLETIN_TERM_ORDER.indexOf(term)
}
