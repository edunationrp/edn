import { createClient } from '@/lib/supabase/server'
import { getWorkflowStatus, type AdmissionWorkflowStatus } from '@/lib/admissions/workflow'
import { parseDossierMetadata } from '@/lib/admissions/dossier-metadata'
import { formatAdmissionTrackingRef } from '@/lib/admissions/format'

export type AdmissionDossierRow = {
  requestId: string
  studentId: string | null
  iun: string | null
  firstName: string
  lastName: string
  birthDate: string
  createdAt: string
  workflowStatus: AdmissionWorkflowStatus
  className: string | null
  channel: string
  requestStatus: 'pending' | 'approved' | 'rejected'
}

export type ArchivedAdmissionRow = {
  requestId: string
  firstName: string
  lastName: string
  className: string | null
  createdAt: string
  rejectedAt: string | null
  rejectionReason: string
  trackingRef: string
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
    status: string
    student_enrollments: Array<{ classes: { name: string } | null }> | null
  } | null
}

function mapRequestRow(
  row: RawRequest,
  options?: { includeClosed?: boolean }
): AdmissionDossierRow | null {
  const meta = parseDossierMetadata(row.metadata)
  const workflowStatus = getWorkflowStatus(row.metadata)
  const isOpen = row.status === 'pending'
  const requestStatus = row.status as AdmissionDossierRow['requestStatus']

  if (!options?.includeClosed && !isOpen) return null

  if (row.student_id && row.students) {
    if (!options?.includeClosed && row.students.status !== 'pending' && !isOpen) return null
    const enrollment = row.students.student_enrollments?.[0]
    return {
      requestId: row.id,
      studentId: row.students.id,
      iun: row.students.iun,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
      birthDate: row.students.birth_date,
      createdAt: row.created_at,
      workflowStatus,
      className: enrollment?.classes?.name ?? meta.class_name ?? null,
      channel: row.channel,
      requestStatus,
    }
  }

  if (!options?.includeClosed && !isOpen) return null
  if (!meta.first_name || !meta.last_name) return null

  return {
    requestId: row.id,
    studentId: null,
    iun: null,
    firstName: meta.first_name,
    lastName: meta.last_name,
    birthDate: meta.birth_date ?? '',
    createdAt: row.created_at,
    workflowStatus,
    className: meta.class_name ?? null,
    channel: row.channel,
    requestStatus,
  }
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
        status,
        student_enrollments(classes(name))
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return ((data ?? []) as RawRequest[])
    .map(row => mapRequestRow(row))
    .filter(Boolean) as AdmissionDossierRow[]
}

export async function getAdmissionRequest(schoolId: string, requestId: string) {
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
        status,
        student_enrollments(classes(name))
      )
    `)
    .eq('school_id', schoolId)
    .eq('id', requestId)
    .limit(1)

  const row = (data as RawRequest[] | null)?.[0]
  if (!row) return null
  return mapRequestRow(row, { includeClosed: true })
}

export async function getRefusedAdmissions(schoolId: string): Promise<ArchivedAdmissionRow[]> {
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
        status,
        student_enrollments(classes(name))
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'rejected')
    .order('created_at', { ascending: false })

  return ((data ?? []) as RawRequest[])
    .map(row => {
      const meta = parseDossierMetadata(row.metadata)
      const mapped = mapRequestRow(row, { includeClosed: true })
      if (!mapped) return null
      const reason = meta.rejection_reason?.trim()
      if (!reason) return null
      return {
        requestId: row.id,
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        className: mapped.className,
        createdAt: row.created_at,
        rejectedAt: meta.rejected_at ?? null,
        rejectionReason: reason,
        trackingRef: meta.tracking_ref ?? formatAdmissionTrackingRef(row.id),
      }
    })
    .filter(Boolean) as ArchivedAdmissionRow[]
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

  const admittedAwaitingPayment = (await getAdmittedAwaitingPayment(schoolId)).length

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

  const { data: requestsRaw } = await supabase
    .from('student_registration_requests')
    .select(`
      id,
      student_id,
      created_at,
      metadata,
      students(
        id,
        iun,
        first_name,
        last_name,
        created_at,
        student_enrollments(classes(name))
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'approved')
    .not('student_id', 'is', null)
    .order('created_at', { ascending: false })

  type ApprovedRequest = {
    id: string
    student_id: string
    created_at: string
    metadata: Record<string, unknown> | null
    students: {
      id: string
      iun: string
      first_name: string
      last_name: string
      created_at: string
      student_enrollments: Array<{ classes: { name: string } | null }> | null
    } | null
  }

  const requests = (requestsRaw as ApprovedRequest[] | null) ?? []
  if (requests.length === 0) return []

  const studentIds = [
    ...new Set(requests.map(r => r.student_id).filter(Boolean)),
  ]

  const { data: paymentsRaw } = await supabase
    .from('payments')
    .select('student_id')
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .in('status', ['paid', 'partial'])

  const encashedStudentIds = new Set(
    ((paymentsRaw ?? []) as Array<{ student_id: string }>).map(p => p.student_id)
  )

  const seen = new Set<string>()

  return requests
    .filter(r => {
      if (!r.student_id || !r.students) return false
      if (encashedStudentIds.has(r.student_id)) return false
      if (seen.has(r.student_id)) return false
      seen.add(r.student_id)
      return true
    })
    .map(r => {
      const s = r.students!
      const meta = r.metadata ?? {}
      const admittedAt =
        (typeof meta.decided_at === 'string' && meta.decided_at) ||
        r.created_at
      return {
        requestId: r.id,
        studentId: s.id,
        iun: s.iun,
        firstName: s.first_name,
        lastName: s.last_name,
        createdAt: admittedAt,
        className: s.student_enrollments?.[0]?.classes?.name ?? null,
      }
    })
}
