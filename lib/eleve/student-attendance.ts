import { createClient } from '@/lib/supabase/server'
import {
  DEFAULT_ABSENCE_ALERT_THRESHOLD,
  DEFAULT_ABSENCE_ALERT_WINDOW_DAYS,
  getAbsenceAlertConfig,
  type AbsenceAlertConfig,
} from '@/lib/attendance/absence-alerts'
import type { StudentAbsenceRecord } from '@/lib/eleve/student-attendance-shared'

export type { StudentAbsenceJustification, StudentAbsenceRecord } from '@/lib/eleve/student-attendance-shared'

export type StudentAbsencePageData = {
  records: StudentAbsenceRecord[]
  alertConfig: AbsenceAlertConfig
  className: string
}

export async function getStudentAbsencePageData(
  studentId: string,
  schoolId: string,
  schoolYearId: string,
  className: string,
): Promise<StudentAbsencePageData> {
  const supabase = await createClient()

  const [alertConfig, { data: recordsRaw }] = await Promise.all([
    getAbsenceAlertConfig(supabase, schoolId),
    supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        recorded_at,
        subjects(name),
        attendance_justifications(
          reason,
          status
        )
      `)
      .eq('student_id', studentId)
      .eq('school_year_id', schoolYearId)
      .in('status', ['absent', 'late'])
      .order('recorded_at', { ascending: false }),
  ])

  const records = ((recordsRaw ?? []) as Array<{
    id: string
    status: string
    recorded_at: string
    subjects: { name: string } | null
    attendance_justifications: Array<{
      reason: string
      status: 'pending' | 'approved' | 'rejected'
    }> | null
  }>).map(record => {
    const justif = record.attendance_justifications?.[0] ?? null
    return {
      id: record.id,
      status: record.status as 'absent' | 'late',
      recordedAt: record.recorded_at,
      subjectName: record.subjects?.name ?? 'Cours',
      justification: justif
        ? { status: justif.status, reason: justif.reason }
        : null,
    }
  })

  return {
    records,
    alertConfig: alertConfig ?? {
      threshold: DEFAULT_ABSENCE_ALERT_THRESHOLD,
      windowDays: DEFAULT_ABSENCE_ALERT_WINDOW_DAYS,
    },
    className,
  }
}
