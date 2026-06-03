export type StudentAbsenceJustification = {
  status: 'pending' | 'approved' | 'rejected'
  reason: string
}

export type StudentAbsenceRecord = {
  id: string
  status: 'absent' | 'late'
  recordedAt: string
  subjectName: string
  justification: StudentAbsenceJustification | null
}

export function filterRecordsByPeriod(
  records: StudentAbsenceRecord[],
  period: 'all' | 'month' | 'trimester',
): StudentAbsenceRecord[] {
  if (period === 'all') return records

  const now = new Date()

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return records.filter(r => new Date(r.recordedAt) >= start)
  }

  const start = new Date(now)
  start.setDate(start.getDate() - 90)
  return records.filter(r => new Date(r.recordedAt) >= start)
}

export type SchoolTrimester = 'T1' | 'T2' | 'T3'

export type TrimesterRecap = {
  id: SchoolTrimester
  label: string
  periodHint: string
  absences: number
  lates: number
  subjectCount: number
}

export const TRIMESTER_META: Record<SchoolTrimester, { label: string; periodHint: string }> = {
  T1: { label: 'Trimestre 1', periodHint: 'Oct. — Déc.' },
  T2: { label: 'Trimestre 2', periodHint: 'Janv. — Mars' },
  T3: { label: 'Trimestre 3', periodHint: 'Avr. — Juin' },
}

export function getSchoolTrimester(date: Date): SchoolTrimester {
  const month = date.getMonth()
  if (month >= 9) return 'T1'
  if (month <= 2) return 'T2'
  return 'T3'
}

export function buildTrimesterRecap(records: StudentAbsenceRecord[]): TrimesterRecap[] {
  const buckets: Record<SchoolTrimester, { absences: number; lates: number; subjects: Set<string> }> = {
    T1: { absences: 0, lates: 0, subjects: new Set() },
    T2: { absences: 0, lates: 0, subjects: new Set() },
    T3: { absences: 0, lates: 0, subjects: new Set() },
  }

  for (const record of records) {
    const term = getSchoolTrimester(new Date(record.recordedAt))
    buckets[term].subjects.add(record.subjectName)
    if (record.status === 'absent') buckets[term].absences += 1
    else buckets[term].lates += 1
  }

  return (['T1', 'T2', 'T3'] as const).map(id => ({
    id,
    label: TRIMESTER_META[id].label,
    periodHint: TRIMESTER_META[id].periodHint,
    absences: buckets[id].absences,
    lates: buckets[id].lates,
    subjectCount: buckets[id].subjects.size,
  }))
}

export type DayMarkerKind = 'absent' | 'late' | 'both'

export function buildDayMarkers(records: StudentAbsenceRecord[]): Map<string, DayMarkerKind> {
  const map = new Map<string, { absent: boolean; late: boolean }>()

  for (const record of records) {
    const key = record.recordedAt.slice(0, 10)
    const entry = map.get(key) ?? { absent: false, late: false }
    if (record.status === 'absent') entry.absent = true
    else entry.late = true
    map.set(key, entry)
  }

  const result = new Map<string, DayMarkerKind>()
  for (const [key, entry] of map) {
    if (entry.absent && entry.late) result.set(key, 'both')
    else if (entry.absent) result.set(key, 'absent')
    else result.set(key, 'late')
  }
  return result
}

export type TrimesterSubjectGroup = {
  termId: SchoolTrimester
  termLabel: string
  periodHint: string
  subjects: Array<{
    subjectName: string
    rows: StudentAbsenceRecord[]
  }>
}

export function groupRecordsByTrimesterAndSubject(
  records: StudentAbsenceRecord[],
): TrimesterSubjectGroup[] {
  const byTerm: Record<SchoolTrimester, Map<string, StudentAbsenceRecord[]>> = {
    T1: new Map(),
    T2: new Map(),
    T3: new Map(),
  }

  for (const record of records) {
    const term = getSchoolTrimester(new Date(record.recordedAt))
    const map = byTerm[term]
    if (!map.has(record.subjectName)) map.set(record.subjectName, [])
    map.get(record.subjectName)!.push(record)
  }

  return (['T1', 'T2', 'T3'] as const).map(termId => {
    const subjectMap = byTerm[termId]
    const subjects = [...subjectMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'fr'))
      .map(([subjectName, rows]) => ({
        subjectName,
        rows: rows.sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
        ),
      }))

    return {
      termId,
      termLabel: TRIMESTER_META[termId].label,
      periodHint: TRIMESTER_META[termId].periodHint,
      subjects,
    }
  })
}

export function justificationPdfDetail(record: StudentAbsenceRecord): {
  statusLabel: string
  motif: string
} {
  if (record.status === 'late') {
    return { statusLabel: 'Retard', motif: '—' }
  }
  if (!record.justification) {
    return { statusLabel: 'Non justifiée', motif: '—' }
  }
  const statusLabel = justificationLabel(record)
  const motif =
    record.justification.reason.trim().length > 0
      ? record.justification.reason.trim()
      : '—'
  return { statusLabel, motif }
}

export function justificationLabel(record: StudentAbsenceRecord): string {
  if (record.status === 'late') return 'Retard'
  if (!record.justification) return 'Non justifiée'
  if (record.justification.status === 'approved') return 'Justifiée'
  if (record.justification.status === 'pending') return 'En attente'
  return 'Refusée'
}

export function countWindowAbsencesForAlert(
  records: StudentAbsenceRecord[],
  windowDays: number,
): number {
  const start = new Date()
  start.setDate(start.getDate() - windowDays)
  start.setHours(0, 0, 0, 0)

  return records.filter(record => {
    if (record.status !== 'absent') return false
    if (new Date(record.recordedAt) < start) return false
    if (record.justification?.status === 'approved') return false
    return true
  }).length
}
