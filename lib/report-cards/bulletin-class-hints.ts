import { formatClassComparison } from '@/lib/grades/class-average-hints'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export type BulletinClassHint = {
  subjectName: string
  message: string
}

/**
 * Comparaisons discrètes élève vs moyenne de classe (données déjà dans le snapshot).
 */
export function buildBulletinClassHints(
  snapshot: BulletinSnapshot,
  maxHints = 2,
): BulletinClassHint[] {
  const hints: BulletinClassHint[] = []

  for (const subject of snapshot.subjects) {
    if (subject.studentAverage === null || subject.classAverage === null) continue
    const message = formatClassComparison(subject.studentAverage, subject.classAverage)
    if (!message) continue
    hints.push({ subjectName: subject.name, message })
  }

  hints.sort((a, b) => {
    const avgA =
      snapshot.subjects.find(s => s.name === a.subjectName)?.studentAverage ?? 0
    const avgB =
      snapshot.subjects.find(s => s.name === b.subjectName)?.studentAverage ?? 0
    return avgB - avgA
  })

  return hints.slice(0, maxHints)
}
