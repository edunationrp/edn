import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

export const DEFAULT_ABSENCE_ALERT_THRESHOLD = 5
export const DEFAULT_ABSENCE_ALERT_WINDOW_DAYS = 30

export const ABSENCE_ALERT_STAFF_ROLES = [
  'SECRETAIRE',
  'VIE_SCOLAIRE',
  'SURVEILLANT_GENERAL',
  'CENSEUR',
  'CONSEILLER',
  'CONSEILLER_EDUCATION',
  'PROVISEUR',
  'DIRECTEUR_ADJOINT',
  'FONDATEUR',
] as const

export type AbsenceAlertStudent = {
  studentId: string
  studentName: string
  className: string | null
  iun: string
  totalAbsences: number
  unjustifiedAbsences: number
  justifiedAbsences: number
  pendingJustifications: number
  lastAbsenceAt: string | null
  exceedsThreshold: boolean
}

export type AbsenceAlertConfig = {
  threshold: number
  windowDays: number
}

export function canViewAbsenceAlerts(roleCode: string) {
  return (ABSENCE_ALERT_STAFF_ROLES as readonly string[]).includes(roleCode)
}

function windowStartIso(windowDays: number) {
  const start = new Date()
  start.setDate(start.getDate() - windowDays)
  start.setHours(0, 0, 0, 0)
  return start.toISOString()
}

function periodKey(windowDays: number) {
  const today = new Date().toISOString().slice(0, 10)
  return `${today}:${windowDays}d`
}

export async function getAbsenceAlertConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
): Promise<AbsenceAlertConfig> {
  const { data } = await supabase
    .from('schools')
    .select('absence_alert_threshold, absence_alert_window_days')
    .eq('id', schoolId)
    .limit(1)

  const row = (data as Array<{
    absence_alert_threshold: number | null
    absence_alert_window_days: number | null
  }> | null)?.[0]

  return {
    threshold: row?.absence_alert_threshold ?? DEFAULT_ABSENCE_ALERT_THRESHOLD,
    windowDays: row?.absence_alert_window_days ?? DEFAULT_ABSENCE_ALERT_WINDOW_DAYS,
  }
}

export async function getStudentsAbsenceAlerts(
  schoolId: string,
  config?: Partial<AbsenceAlertConfig>,
): Promise<{ config: AbsenceAlertConfig; students: AbsenceAlertStudent[] }> {
  const supabase = await createClient()
  const resolved = {
    ...(await getAbsenceAlertConfig(supabase, schoolId)),
    ...config,
  }

  const since = windowStartIso(resolved.windowDays)

  const { data: schoolYearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)

  const schoolYearId = (schoolYearRaw as Array<{ id: string }> | null)?.[0]?.id

  const { data: recordsRaw } = await supabase
    .from('attendance_records')
    .select('id, student_id, status, recorded_at')
    .eq('school_id', schoolId)
    .in('status', ['absent', 'late'])
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: false })

  const records = (recordsRaw ?? []) as Array<{
    id: string
    student_id: string
    status: string
    recorded_at: string
  }>

  if (records.length === 0) {
    return { config: resolved, students: [] }
  }

  const recordIds = records.map(r => r.id)
  const studentIds = [...new Set(records.map(r => r.student_id))]

  const [{ data: justifRaw }, { data: studentsRaw }, enrollmentsResult] = await Promise.all([
    supabase
      .from('attendance_justifications')
      .select('attendance_record_id, status')
      .in('attendance_record_id', recordIds),
    supabase
      .from('students')
      .select('id, first_name, last_name, iun')
      .in('id', studentIds)
      .eq('school_id', schoolId),
    schoolYearId
      ? supabase
          .from('student_enrollments')
          .select('student_id, classes(name)')
          .eq('school_id', schoolId)
          .eq('school_year_id', schoolYearId)
          .eq('status', 'active')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [] }),
  ])

  const justifByRecord = new Map<string, string>()
  for (const row of (justifRaw ?? []) as Array<{ attendance_record_id: string; status: string }>) {
    justifByRecord.set(row.attendance_record_id, row.status)
  }

  const classByStudent = new Map<string, string>()
  for (const row of (enrollmentsResult.data ?? []) as Array<{
    student_id: string
    classes: { name: string } | null
  }>) {
    if (row.classes?.name) classByStudent.set(row.student_id, row.classes.name)
  }

  const studentInfo = new Map(
    ((studentsRaw ?? []) as Array<{
      id: string
      first_name: string
      last_name: string
      iun: string
    }>).map(s => [
      s.id,
      {
        name: `${s.last_name} ${s.first_name}`.trim(),
        iun: s.iun,
      },
    ]),
  )

  const grouped = new Map<string, {
    total: number
    unjustified: number
    justified: number
    pending: number
    lastAt: string | null
  }>()

  for (const record of records) {
    const bucket = grouped.get(record.student_id) ?? {
      total: 0,
      unjustified: 0,
      justified: 0,
      pending: 0,
      lastAt: null,
    }
    bucket.total += 1
    if (!bucket.lastAt || record.recorded_at > bucket.lastAt) {
      bucket.lastAt = record.recorded_at
    }

    const justifStatus = justifByRecord.get(record.id)
    if (justifStatus === 'approved') bucket.justified += 1
    else if (justifStatus === 'pending') bucket.pending += 1
    else bucket.unjustified += 1

    grouped.set(record.student_id, bucket)
  }

  const students: AbsenceAlertStudent[] = [...grouped.entries()]
    .map(([studentId, stats]) => {
      const info = studentInfo.get(studentId)
      return {
        studentId,
        studentName: info?.name ?? 'Élève',
        className: classByStudent.get(studentId) ?? null,
        iun: info?.iun ?? '—',
        totalAbsences: stats.total,
        unjustifiedAbsences: stats.unjustified,
        justifiedAbsences: stats.justified,
        pendingJustifications: stats.pending,
        lastAbsenceAt: stats.lastAt,
        exceedsThreshold: stats.unjustified >= resolved.threshold,
      }
    })
    .filter(s => s.exceedsThreshold)
    .sort((a, b) => b.unjustifiedAbsences - a.unjustifiedAbsences)

  return { config: resolved, students }
}

async function getAlertStaffUserIds(schoolId: string) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return []
  }

  const { data } = await admin
    .from('user_school_roles')
    .select('user_id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .in('role_code', [...ABSENCE_ALERT_STAFF_ROLES])

  return [...new Set(((data ?? []) as Array<{ user_id: string }>).map(r => r.user_id))]
}

export async function processAbsenceThresholdAlerts(
  schoolId: string,
  studentIds: string[],
) {
  if (studentIds.length === 0) return { notified: 0 }

  const uniqueIds = [...new Set(studentIds)]
  const { config, students } = await getStudentsAbsenceAlerts(schoolId)
  const flagged = students.filter(s => uniqueIds.includes(s.studentId))

  if (flagged.length === 0) return { notified: 0 }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { notified: 0, error: 'admin_unavailable' as const }
  }

  const staffIds = await getAlertStaffUserIds(schoolId)
  if (staffIds.length === 0) return { notified: 0 }

  const key = periodKey(config.windowDays)
  let notified = 0

  for (const student of flagged) {
    const { data: existing } = await admin
      .from('attendance_absence_alert_log')
      .select('id')
      .eq('school_id', schoolId)
      .eq('student_id', student.studentId)
      .eq('period_key', key)
      .limit(1)

    if ((existing as unknown[] | null)?.length) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logError } = await (admin as any).from('attendance_absence_alert_log').insert({
      school_id: schoolId,
      student_id: student.studentId,
      period_key: key,
      absence_count: student.unjustifiedAbsences,
    })

    if (logError) continue

    await Promise.all(
      staffIds.map(staffId =>
        dispatchNotification({
          userId: staffId,
          schoolId,
          title: 'Seuil d\'absences dépassé',
          body: `${student.studentName} (${student.className ?? 'classe inconnue'}) — ${student.unjustifiedAbsences} absence(s) non justifiée(s) sur ${config.windowDays} jours.`,
          type: 'attendance_threshold',
          actionPath: '/dashboard/attendance/alerts',
          sendEmail: false,
        }),
      ),
    )
    notified += 1
  }

  return { notified }
}
