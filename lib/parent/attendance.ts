import { createClient } from '@/lib/supabase/server'

export type ParentAbsenceRecord = {
  id: string
  status: string
  recordedAt: string
  subjectName: string | null
  justification: {
    id: string
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    createdAt: string | null
    reviewedAt: string | null
  } | null
}

export async function getParentAbsenceRecords(studentId: string): Promise<ParentAbsenceRecord[]> {
  const supabase = await createClient()

  const { data: recordsRaw } = await supabase
    .from('attendance_records')
    .select(`
      id,
      status,
      recorded_at,
      subjects(name),
      attendance_justifications(
        id,
        reason,
        status,
        created_at,
        reviewed_at
      )
    `)
    .eq('student_id', studentId)
    .in('status', ['absent', 'late'])
    .order('recorded_at', { ascending: false })

  return ((recordsRaw ?? []) as Array<{
    id: string
    status: string
    recorded_at: string
    subjects: { name: string } | null
    attendance_justifications: Array<{
      id: string
      reason: string
      status: 'pending' | 'approved' | 'rejected'
      created_at: string | null
      reviewed_at: string | null
    }> | null
  }>).map(record => {
    const justification = record.attendance_justifications?.[0] ?? null
    return {
      id: record.id,
      status: record.status,
      recordedAt: record.recorded_at,
      subjectName: record.subjects?.name ?? null,
      justification: justification
        ? {
            id: justification.id,
            reason: justification.reason,
            status: justification.status,
            createdAt: justification.created_at,
            reviewedAt: justification.reviewed_at,
          }
        : null,
    }
  })
}

export async function countPendingParentJustifications(studentId: string): Promise<number> {
  const records = await getParentAbsenceRecords(studentId)
  return records.filter(record => record.justification?.status === 'pending').length
}
