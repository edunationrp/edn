import { createClient } from '@/lib/supabase/server'
import { getWorkflowStatus, type AdmissionWorkflowStatus } from '@/lib/admissions/workflow'

export type AdmissionDossierRow = {
  requestId: string
  studentId: string
  iun: string
  firstName: string
  lastName: string
  birthDate: string
  createdAt: string
  workflowStatus: AdmissionWorkflowStatus
  className: string | null
  channel: string
}

type RawRequest = {
  id: string
  student_id: string | null
  channel: string
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  students: {
    id: string
    iun: string
    first_name: string
    last_name: string
    birth_date: string
    birth_place: string | null
    status: string
    student_enrollments: Array<{ classes: { name: string } | null }> | null
  } | null
}

async function fetchOpenRequests(schoolId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('student_registration_requests')
    .select(`
      id,
      student_id,
      channel,
      status,
      metadata,
      created_at,
      students(
        id,
        iun,
        first_name,
        last_name,
        birth_date,
        birth_place,
        status,
        student_enrollments(classes(name))
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const fromRequests = ((data ?? []) as RawRequest[])
    .filter(row => row.students?.status === 'pending')
    .map(row => {
      const student = row.students!
      const enrollment = student.student_enrollments?.[0]
      return {
        requestId: row.id,
        studentId: student.id,
        iun: student.iun,
        firstName: student.first_name,
        lastName: student.last_name,
        birthDate: student.birth_date,
        createdAt: row.created_at,
        workflowStatus: getWorkflowStatus(row.metadata),
        className: enrollment?.classes?.name ?? null,
        channel: row.channel,
      } satisfies AdmissionDossierRow
    })

  const linkedStudentIds = new Set(fromRequests.map(d => d.studentId))

  const { data: orphanStudentsRaw } = await supabase
    .from('students')
    .select(`
      id,
      iun,
      first_name,
      last_name,
      birth_date,
      created_at,
      student_enrollments(classes(name))
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const orphans = ((orphanStudentsRaw ?? []) as Array<{
    id: string
    iun: string
    first_name: string
    last_name: string
    birth_date: string
    created_at: string
    student_enrollments: Array<{ classes: { name: string } | null }> | null
  }>)
    .filter(s => !linkedStudentIds.has(s.id))
    .map(student => ({
      requestId: `orphan-${student.id}`,
      studentId: student.id,
      iun: student.iun,
      firstName: student.first_name,
      lastName: student.last_name,
      birthDate: student.birth_date,
      createdAt: student.created_at,
      workflowStatus: 'A_COMPLETER' as const,
      className: student.student_enrollments?.[0]?.classes?.name ?? null,
      channel: 'legacy',
    }))

  return [...fromRequests, ...orphans]
}

export async function getAdmissionStats(schoolId: string) {
  const dossiers = await fetchOpenRequests(schoolId)

  const toComplete = dossiers.filter(d =>
    ['A_COMPLETER', 'EN_COMPLETION', 'DOCUMENT_MANQUANT'].includes(d.workflowStatus)
  ).length
  const readyToSubmit = dossiers.filter(d => d.workflowStatus === 'PRET_VALIDATION').length
  const awaitingProviseur = dossiers.filter(d => d.workflowStatus === 'EN_ATTENTE_PROVISEUR').length

  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - 1)

  const { count: newToday } = await supabase
    .from('student_registration_requests')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .gte('created_at', since.toISOString())

  const { data: activeStudentsRaw } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .eq('status', 'active')

  const activeStudentIds = ((activeStudentsRaw ?? []) as Array<{ id: string }>).map(s => s.id)

  let admittedAwaitingPayment = 0
  if (activeStudentIds.length > 0) {
    const { data: paymentsRaw } = await supabase
      .from('payments')
      .select('student_id, status')
      .eq('school_id', schoolId)
      .in('student_id', activeStudentIds)

    const paidStudentIds = new Set(
      ((paymentsRaw ?? []) as Array<{ student_id: string; status: string }>)
        .filter(p => p.status === 'paid')
        .map(p => p.student_id)
    )
    admittedAwaitingPayment = activeStudentIds.filter(id => !paidStudentIds.has(id)).length
  }

  return {
    totalOpen: dossiers.length,
    toComplete,
    readyToSubmit,
    awaitingProviseur,
    newToday: newToday ?? 0,
    admittedAwaitingPayment,
    dossiers,
  }
}

export async function getSecretaryQueue(schoolId: string) {
  const { dossiers } = await getAdmissionStats(schoolId)
  return dossiers.filter(d =>
    ['A_COMPLETER', 'EN_COMPLETION', 'DOCUMENT_MANQUANT', 'PRET_VALIDATION'].includes(d.workflowStatus)
  )
}

export async function getProviseurQueue(schoolId: string) {
  const { dossiers } = await getAdmissionStats(schoolId)
  return dossiers.filter(d => d.workflowStatus === 'EN_ATTENTE_PROVISEUR')
}

export async function getAdmittedAwaitingPayment(schoolId: string) {
  const supabase = await createClient()

  const { data: studentsRaw } = await supabase
    .from('students')
    .select(`
      id,
      iun,
      first_name,
      last_name,
      created_at,
      student_enrollments(classes(name))
    `)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100)

  const students = (studentsRaw ?? []) as Array<{
    id: string
    iun: string
    first_name: string
    last_name: string
    created_at: string
    student_enrollments: Array<{ classes: { name: string } | null }> | null
  }>

  if (students.length === 0) return []

  const studentIds = students.map(s => s.id)
  const { data: paymentsRaw } = await supabase
    .from('payments')
    .select('student_id, status')
    .eq('school_id', schoolId)
    .in('student_id', studentIds)

  const paidStudentIds = new Set(
    ((paymentsRaw ?? []) as Array<{ student_id: string; status: string }>)
      .filter(p => p.status === 'paid')
      .map(p => p.student_id)
  )

  return students
    .filter(s => !paidStudentIds.has(s.id))
    .map(s => ({
      studentId: s.id,
      iun: s.iun,
      firstName: s.first_name,
      lastName: s.last_name,
      createdAt: s.created_at,
      className: s.student_enrollments?.[0]?.classes?.name ?? null,
    }))
}
