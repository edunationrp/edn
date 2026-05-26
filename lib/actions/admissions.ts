'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { AdmissionWorkflowStatus } from '@/lib/admissions/workflow'
import { enrollStudentPublic } from '@/lib/actions/enrollment'

function getDb() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

async function requireRole(permissions: Array<'students:create' | 'students:update' | 'students:validate'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }

  const role = ctx.role_code
  if (!permissions.some(p => hasPermission(role, p))) {
    return { error: 'Accès refusé.' as const }
  }

  return { supabase, user, schoolId: ctx.school_id, role }
}

async function updateRequestWorkflow(
  requestId: string,
  schoolId: string,
  workflowStatus: AdmissionWorkflowStatus,
  extraMetadata?: Record<string, unknown>
) {
  const supabase = getDb() ?? await createClient()

  const { data: raw } = await supabase
    .from('student_registration_requests')
    .select('metadata')
    .eq('id', requestId)
    .eq('school_id', schoolId)
    .limit(1)

  const current = (raw as Array<{ metadata: Record<string, unknown> | null }> | null)?.[0]
  if (!current) return { error: 'Dossier introuvable.' }

  const metadata = {
    ...(current.metadata ?? {}),
    workflow_status: workflowStatus,
    ...extraMetadata,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('student_registration_requests')
    .update({ metadata })
    .eq('id', requestId)
    .eq('school_id', schoolId)

  if (error) return { error: error.message }
  return { success: true as const }
}

function revalidateAdmissionPaths() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admissions/to-process')
  revalidatePath('/dashboard/admissions/to-validate')
  revalidatePath('/dashboard/admissions/admitted')
  revalidatePath('/dashboard/students/pending')
  revalidatePath('/dashboard/students')
}

export async function createMinimalAdmissionRequest(input: {
  firstName: string
  lastName: string
  birthDate: string
  classId?: string
  parentPhone?: string
  parentFirstName?: string
  parentLastName?: string
}) {
  const access = await requireRole(['students:validate'])
  if ('error' in access) return access

  const result = await enrollStudentPublic(
    {
      schoolId: access.schoolId,
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: input.birthDate,
      birthPlace: 'À compléter',
      gender: 'M',
      classId: input.classId,
      parentPhone: input.parentPhone,
      parentFirstName: input.parentFirstName,
      parentLastName: input.parentLastName,
      hasStudentPhone: false,
    },
    { mode: 'public' }
  )

  if ('error' in result && result.error) return result
  if (!('success' in result) || !result.success) return { error: 'Erreur lors de la création.' }

  const db = getDb() ?? access.supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from('student_registration_requests')
    .update({
      channel: 'secretariat',
      metadata: {
        workflow_status: 'A_COMPLETER',
        created_by_role: 'PROVISEUR',
        class_id: input.classId ?? null,
      },
    })
    .eq('student_id', result.studentId)
    .eq('school_id', access.schoolId)

  revalidateAdmissionPaths()
  return result
}

export async function updateAdmissionWorkflowStatus(
  requestId: string,
  workflowStatus: AdmissionWorkflowStatus
) {
  const access = await requireRole(['students:update'])
  if ('error' in access) return access

  if (requestId.startsWith('orphan-')) {
    return { success: true as const }
  }

  const result = await updateRequestWorkflow(requestId, access.schoolId, workflowStatus, {
    updated_by: access.user.id,
    updated_at: new Date().toISOString(),
  })

  if ('error' in result) return result
  revalidateAdmissionPaths()
  return { success: true as const }
}

export async function submitAdmissionForValidation(requestId: string) {
  const access = await requireRole(['students:update'])
  if ('error' in access) return access

  if (requestId.startsWith('orphan-')) {
    const studentId = requestId.replace('orphan-', '')
    const db = getDb() ?? access.supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db as any)
      .from('student_registration_requests')
      .insert({
        school_id: access.schoolId,
        student_id: studentId,
        channel: 'secretariat',
        status: 'pending',
        metadata: {
          workflow_status: 'EN_ATTENTE_PROVISEUR',
          submitted_by: access.user.id,
          submitted_at: new Date().toISOString(),
        },
      })
    if (error) return { error: error.message }
    revalidateAdmissionPaths()
    return { success: true as const }
  }

  const result = await updateRequestWorkflow(requestId, access.schoolId, 'EN_ATTENTE_PROVISEUR', {
    submitted_by: access.user.id,
    submitted_at: new Date().toISOString(),
  })

  if ('error' in result) return result
  revalidateAdmissionPaths()
  return { success: true as const }
}

export async function returnAdmissionForCorrection(requestId: string, comment: string) {
  const access = await requireRole(['students:validate'])
  if ('error' in access) return access

  if (!comment.trim()) return { error: 'Commentaire requis.' }

  if (requestId.startsWith('orphan-')) {
    revalidateAdmissionPaths()
    return { success: true as const }
  }

  const result = await updateRequestWorkflow(requestId, access.schoolId, 'EN_COMPLETION', {
    returned_by: access.user.id,
    returned_at: new Date().toISOString(),
    return_comment: comment.trim(),
  })

  if ('error' in result) return result
  revalidateAdmissionPaths()
  return { success: true as const }
}

export async function decideAdmission(
  requestId: string,
  studentId: string,
  decision: 'active' | 'rejected'
) {
  const access = await requireRole(['students:validate'])
  if ('error' in access) return access

  const supabase = getDb() ?? access.supabase
  const effectiveRequestId = requestId.startsWith('orphan-') ? null : requestId

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: studentError } = await (supabase as any)
    .from('students')
    .update({ status: decision === 'active' ? 'active' : 'rejected' })
    .eq('id', studentId)
    .eq('school_id', access.schoolId)

  if (studentError) return { error: studentError.message }

  if (decision === 'active') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('student_enrollments')
      .update({ status: 'active' })
      .eq('student_id', studentId)
      .eq('school_id', access.schoolId)
  }

  if (effectiveRequestId) {
    const { data: requestRaw } = await supabase
      .from('student_registration_requests')
      .select('metadata')
      .eq('id', effectiveRequestId)
      .eq('school_id', access.schoolId)
      .limit(1)

    const existingMeta = (requestRaw as Array<{ metadata: Record<string, unknown> | null }> | null)?.[0]?.metadata ?? {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: requestError } = await (supabase as any)
      .from('student_registration_requests')
      .update({
        status: decision === 'active' ? 'approved' : 'rejected',
        metadata: {
          ...existingMeta,
          workflow_status: decision === 'active' ? 'VALIDE' : 'REFUSE',
          decided_by: access.user.id,
          decided_at: new Date().toISOString(),
        },
      })
      .eq('id', effectiveRequestId)
      .eq('school_id', access.schoolId)

    if (requestError) return { error: requestError.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('student_registration_requests')
      .insert({
        school_id: access.schoolId,
        student_id: studentId,
        channel: 'secretariat',
        status: decision === 'active' ? 'approved' : 'rejected',
        metadata: {
          workflow_status: decision === 'active' ? 'VALIDE' : 'REFUSE',
          decided_by: access.user.id,
          decided_at: new Date().toISOString(),
        },
      })
  }

  revalidateAdmissionPaths()
  revalidatePath('/dashboard/finance')
  return { success: true as const }
}
