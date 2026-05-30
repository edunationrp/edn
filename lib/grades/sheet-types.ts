export type GradeSequenceSlot = 'devoir1' | 'devoir2' | 'examen'

export type GradeSlotPublicationStatus = 'draft' | 'submitted' | 'published'

export type GradeSlotPublication = {
  status: GradeSlotPublicationStatus
  submittedAt: string | null
  publishedAt: string | null
  teacherNote: string | null
}

export const GRADE_SEQUENCE_SLOTS: GradeSequenceSlot[] = ['devoir1', 'devoir2', 'examen']

export const SLOT_LABELS: Record<GradeSequenceSlot, string> = {
  devoir1: 'Devoir 1',
  devoir2: 'Devoir 2',
  examen: 'Examen',
}

export const SLOT_WEIGHTS: Record<GradeSequenceSlot, number> = {
  devoir1: 0.3,
  devoir2: 0.3,
  examen: 0.4,
}

export type StudentGradeRow = {
  studentId: string
  firstName: string
  lastName: string
  iun: string | null
  devoir1: number | null
  devoir2: number | null
  examen: number | null
  officialDevoir1?: number | null
  officialDevoir2?: number | null
  officialExamen?: number | null
  gradeIds: Partial<Record<GradeSequenceSlot, string>>
}

export type GradeSheetContext = {
  classId: string
  className: string
  subjectId: string
  subjectName: string
  subjectCoefficient: number
  term: string
  evaluationIds: Record<GradeSequenceSlot, string>
  slotPublications: Partial<Record<GradeSequenceSlot, GradeSlotPublication>>
  rows: StudentGradeRow[]
  isLocked: boolean
  pendingSubmission?: {
    id: string
    status: 'pending' | 'validated' | 'rejected'
    rejectionReason?: string | null
  } | null
  lastRejected?: {
    rejectionReason: string | null
    reviewedAt: string | null
  } | null
}

export type GradeSubmissionPreview = {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  term: string
  submittedAt: string
  submitterName: string | null
  secretaryNote: string | null
  rows: Array<
    StudentGradeRow & {
      previousDevoir1: number | null
      previousDevoir2: number | null
      previousExamen: number | null
      hasProposal?: Partial<Record<GradeSequenceSlot, boolean>>
    }
  >
}

export function computeStudentAverage(row: Pick<StudentGradeRow, 'devoir1' | 'devoir2' | 'examen'>): number | null {
  const parts: Array<{ value: number; weight: number }> = []

  if (row.devoir1 !== null) parts.push({ value: row.devoir1, weight: SLOT_WEIGHTS.devoir1 })
  if (row.devoir2 !== null) parts.push({ value: row.devoir2, weight: SLOT_WEIGHTS.devoir2 })
  if (row.examen !== null) parts.push({ value: row.examen, weight: SLOT_WEIGHTS.examen })

  if (parts.length === 0) return null

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0)
  const weighted = parts.reduce((sum, part) => sum + part.value * part.weight, 0)
  return Math.round((weighted / totalWeight) * 10) / 10
}

export function shortAppreciation(average: number | null): string {
  if (average === null) return '—'
  if (average >= 16) return 'Très bien'
  if (average >= 14) return 'Bien'
  if (average >= 12) return 'Assez bien'
  if (average >= 10) return 'Passable'
  if (average >= 8) return 'Insuffisant'
  return 'Très insuffisant'
}

export function shouldShowDropAlert(average: number | null, devoir1: number | null): boolean {
  if (average === null) return false
  if (average < 10) return true
  if (devoir1 !== null && average < devoir1 - 3) return true
  return false
}

export function computeClassStats(averages: number[]) {
  if (averages.length === 0) {
    return { average: null, max: null, min: null, median: null }
  }

  const sorted = [...averages].sort((a, b) => a - b)
  const sum = sorted.reduce((acc, value) => acc + value, 0)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
      : sorted[mid]

  return {
    average: Math.round((sum / sorted.length) * 10) / 10,
    max: sorted[sorted.length - 1],
    min: sorted[0],
    median,
  }
}
