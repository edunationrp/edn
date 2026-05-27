'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import type { AdmissionWorkflowStatus } from '@/lib/admissions/workflow'
import {
  canAccessProviseurAdmissionValidation,
  canAccessSecretaryAdmissionQueue,
} from '@/lib/admissions/access'
import { checkClassCapacity } from '@/lib/admissions/capacity'
import {
  canSubmitToProviseur,
  getDefaultDocuments,
  parseDossierMetadata,
  resetDocumentsAfterReturn,
  type AdmissionDocumentFile,
  type DocumentKey,
  type DocumentStatus,
} from '@/lib/admissions/dossier-metadata'
import { formatAdmissionTrackingRef } from '@/lib/admissions/format'
import { notifyAdmissionStaff } from '@/lib/admissions/notify-staff'

function getDb() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

async function requireSecretary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }
  if (!canAccessSecretaryAdmissionQueue(ctx.role_code)) {
    return { error: 'Accès réservé au secrétariat.' as const }
  }

  return { supabase, user, schoolId: ctx.school_id, role: ctx.role_code }
}

async function requireProviseur() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }
  if (!canAccessProviseurAdmissionValidation(ctx.role_code)) {
    return { error: 'Accès réservé à la direction.' as const }
  }

  return { supabase, user, schoolId: ctx.school_id, role: ctx.role_code }
}

async function getRequest(requestId: string, schoolId: string) {
  const db = getDb() ?? await createClient()
  const { data } = await db
    .from('student_registration_requests')
    .select('id, student_id, status, metadata')
    .eq('id', requestId)
    .eq('school_id', schoolId)
    .limit(1)

  return (data as Array<{
    id: string
    student_id: string | null
    status: string
    metadata: Record<string, unknown> | null
  }> | null)?.[0] ?? null
}

async function updateRequestWorkflow(
  requestId: string,
  schoolId: string,
  workflowStatus: AdmissionWorkflowStatus,
  extraMetadata?: Record<string, unknown>
) {
  const supabase = getDb() ?? await createClient()
  const current = await getRequest(requestId, schoolId)
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
  return { success: true as const, metadata: parseDossierMetadata(metadata) }
}

function revalidateAdmissionPaths() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admissions/to-process')
  revalidatePath('/dashboard/admissions/to-validate')
  revalidatePath('/dashboard/admissions/admitted')
  revalidatePath('/dashboard/admissions/archived')
  revalidatePath('/dashboard/students')
}

const MIN_DECISION_COMMENT_LENGTH = 10

function validateDecisionComment(comment: string, label: string) {
  const trimmed = comment.trim()
  if (trimmed.length < MIN_DECISION_COMMENT_LENGTH) {
    return { error: `${label} : saisissez au moins ${MIN_DECISION_COMMENT_LENGTH} caractères.` as const }
  }
  return { value: trimmed }
}

async function generateIun(birthDate: string) {
  const birthYear = new Date(birthDate).getFullYear()
  const db = getDb() ?? await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc('generate_iun', { p_birth_year: birthYear })
  if (error || !data) return { error: error?.message ?? 'Impossible de générer l\'IUN.' }
  return { iun: data as string }
}

export async function createMinimalAdmissionRequest(input: {
  firstName: string
  lastName: string
  birthDate: string
  classId: string
  parentPhone?: string
  parentFirstName?: string
  parentLastName?: string
}) {
  const access = await requireProviseur()
  if ('error' in access) return access

  if (!input.classId?.trim()) {
    return { error: 'Classe requise pour créer une demande.' }
  }

  const capacity = await checkClassCapacity(access.schoolId, input.classId)
  if (!capacity.ok) return { error: capacity.message }

  const db = getDb() ?? access.supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from('student_registration_requests')
    .insert({
      school_id: access.schoolId,
      student_id: null,
      channel: 'secretariat',
      status: 'pending',
      parent_phone: input.parentPhone?.trim() || null,
      metadata: {
        workflow_status: 'A_COMPLETER',
        created_by_role: 'PROVISEUR',
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim().toUpperCase(),
        birth_date: input.birthDate,
        class_id: input.classId,
        class_name: capacity.className ?? null,
        parent_first_name: input.parentFirstName?.trim() || null,
        parent_last_name: input.parentLastName?.trim() || null,
        parent_phone: input.parentPhone?.trim() || null,
        documents: getDefaultDocuments(),
      },
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Erreur lors de la création.' }

  const requestId = data.id as string
  const trackingRef = formatAdmissionTrackingRef(requestId)
  const created = await getRequest(requestId, access.schoolId)
  if (created) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from('student_registration_requests')
      .update({
        metadata: { ...(created.metadata ?? {}), tracking_ref: trackingRef },
      })
      .eq('id', requestId)
  }

  revalidateAdmissionPaths()
  return { success: true as const, requestId }
}

export async function registerAdmissionDocument(
  requestId: string,
  documentKey: DocumentKey,
  file: AdmissionDocumentFile
) {
  const access = await requireSecretary()
  if ('error' in access) return access

  const current = await getRequest(requestId, access.schoolId)
  if (!current || current.status !== 'pending') return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  if (meta.workflow_status === 'EN_ATTENTE_PROVISEUR') {
    return { error: 'Dossier déjà soumis au proviseur.' }
  }

  const documents = { ...getDefaultDocuments(), ...meta.documents, [documentKey]: 'deposed' as const }
  const document_files = { ...meta.document_files, [documentKey]: file }

  const db = getDb() ?? access.supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('student_registration_requests')
    .update({
      metadata: {
        ...meta,
        documents,
        document_files,
        workflow_status: 'EN_COMPLETION',
      },
    })
    .eq('id', requestId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }

  revalidateAdmissionPaths()
  revalidatePath(`/dashboard/admissions/${requestId}`)
  return { success: true as const }
}

export async function validateAdmissionDocument(requestId: string, documentKey: DocumentKey) {
  const access = await requireSecretary()
  if ('error' in access) return access

  const current = await getRequest(requestId, access.schoolId)
  if (!current) return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  if (!meta.document_files?.[documentKey]?.url) {
    return { error: 'Téléversez d\'abord le PDF de cette pièce.' }
  }

  const documents = { ...getDefaultDocuments(), ...meta.documents, [documentKey]: 'validated' as const }
  const db = getDb() ?? access.supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('student_registration_requests')
    .update({
      metadata: { ...meta, documents },
    })
    .eq('id', requestId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }

  revalidateAdmissionPaths()
  revalidatePath(`/dashboard/admissions/${requestId}`)
  return { success: true as const }
}

export async function completeAdmissionDossier(
  requestId: string,
  input: {
    firstName: string
    lastName: string
    birthDate: string
    birthPlace: string
    gender: 'M' | 'F'
    nationality?: string
    address?: string
    classId: string
    parentFirstName?: string
    parentLastName?: string
    parentPhone?: string
    documents: Partial<Record<DocumentKey, DocumentStatus>>
  }
) {
  const access = await requireSecretary()
  if ('error' in access) return access

  const current = await getRequest(requestId, access.schoolId)
  if (!current || current.status !== 'pending') return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  if (meta.workflow_status === 'EN_ATTENTE_PROVISEUR') {
    return { error: 'Ce dossier est déjà chez le proviseur.' }
  }

  const { data: classRaw } = await access.supabase
    .from('classes')
    .select('name')
    .eq('id', input.classId)
    .eq('school_id', access.schoolId)
    .limit(1)

  const className = (classRaw as Array<{ name: string }> | null)?.[0]?.name ?? null

  const nextMeta = {
    ...meta,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim().toUpperCase(),
    birth_date: input.birthDate,
    birth_place: input.birthPlace.trim(),
    gender: input.gender,
    nationality: input.nationality?.trim() || 'Burkinabè',
    address: input.address?.trim() || null,
    class_id: input.classId,
    class_name: className,
    parent_first_name: input.parentFirstName?.trim() || null,
    parent_last_name: input.parentLastName?.trim() || null,
    parent_phone: input.parentPhone?.trim() || null,
    documents: { ...getDefaultDocuments(), ...meta.documents, ...input.documents },
    document_files: meta.document_files,
    workflow_status: 'EN_COMPLETION' as const,
  }

  const db = getDb() ?? access.supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('student_registration_requests')
    .update({
      parent_phone: input.parentPhone?.trim() || null,
      metadata: nextMeta,
    })
    .eq('id', requestId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }

  revalidateAdmissionPaths()
  revalidatePath(`/dashboard/admissions/${requestId}`)
  return { success: true as const }
}

export async function markAdmissionReady(requestId: string) {
  const access = await requireSecretary()
  if ('error' in access) return access

  const current = await getRequest(requestId, access.schoolId)
  if (!current) return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  if (!canSubmitToProviseur(meta)) {
    return { error: 'Complétez l\'identité et validez toutes les pièces obligatoires.' }
  }

  const result = await updateRequestWorkflow(requestId, access.schoolId, 'PRET_VALIDATION')
  if ('error' in result) return result

  revalidateAdmissionPaths()
  return { success: true as const }
}

export async function submitAdmissionForValidation(requestId: string) {
  const access = await requireSecretary()
  if ('error' in access) return access

  const current = await getRequest(requestId, access.schoolId)
  if (!current) return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  if (meta.workflow_status !== 'PRET_VALIDATION') {
    return { error: 'Marquez d\'abord le dossier comme prêt.' }
  }
  if (!canSubmitToProviseur(meta)) {
    return { error: 'Dossier incomplet.' }
  }

  const result = await updateRequestWorkflow(requestId, access.schoolId, 'EN_ATTENTE_PROVISEUR', {
    submitted_by: access.user.id,
    submitted_at: new Date().toISOString(),
    return_comment: null,
    returned_at: null,
    returned_by: null,
  })

  if ('error' in result) return result
  revalidateAdmissionPaths()
  return { success: true as const }
}

export async function returnAdmissionForCorrection(requestId: string, comment: string) {
  const access = await requireProviseur()
  if ('error' in access) return access

  const validated = validateDecisionComment(comment, 'Motif de correction')
  if ('error' in validated) return validated

  const current = await getRequest(requestId, access.schoolId)
  if (!current || current.status !== 'pending') return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  const documents = resetDocumentsAfterReturn(meta)
  const childName = `${meta.last_name ?? ''} ${meta.first_name ?? ''}`.trim() || 'Dossier admission'

  const db = getDb() ?? access.supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('student_registration_requests')
    .update({
      metadata: {
        ...(current.metadata ?? {}),
        workflow_status: 'EN_COMPLETION',
        documents,
        returned_by: access.user.id,
        returned_at: new Date().toISOString(),
        return_comment: validated.value,
      },
    })
    .eq('id', requestId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }

  await notifyAdmissionStaff(access.schoolId, {
    roles: ['SECRETAIRE'],
    title: 'Dossier à corriger',
    body: `${childName} — le proviseur demande des corrections : ${validated.value}`,
    actionPath: `/dashboard/admissions/${requestId}`,
    excludeUserId: access.user.id,
  })

  revalidateAdmissionPaths()
  revalidatePath(`/dashboard/admissions/${requestId}`)
  return { success: true as const }
}

export async function decideAdmission(
  requestId: string,
  decision: 'active' | 'rejected',
  rejectionReason?: string
) {
  const access = await requireProviseur()
  if ('error' in access) return access

  const db = getDb() ?? access.supabase
  const current = await getRequest(requestId, access.schoolId)
  if (!current || current.status !== 'pending') return { error: 'Dossier introuvable.' }

  const meta = parseDossierMetadata(current.metadata)
  if (meta.workflow_status !== 'EN_ATTENTE_PROVISEUR') {
    return { error: 'Ce dossier n\'est pas en attente de décision.' }
  }

  if (decision === 'rejected') {
    const validated = validateDecisionComment(rejectionReason ?? '', 'Motif de refus')
    if ('error' in validated) return validated

    const trackingRef =
      meta.tracking_ref ?? formatAdmissionTrackingRef(requestId)
    const childName = `${meta.last_name ?? ''} ${meta.first_name ?? ''}`.trim() || 'Dossier admission'
    const rejectedAt = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db as any)
      .from('student_registration_requests')
      .update({
        status: 'rejected',
        metadata: {
          ...current.metadata,
          workflow_status: 'REFUSE',
          decided_by: access.user.id,
          decided_at: rejectedAt,
          rejected_at: rejectedAt,
          rejection_reason: validated.value,
          tracking_ref: trackingRef,
        },
      })
      .eq('id', requestId)

    if (error) return { error: error.message }

    await notifyAdmissionStaff(access.schoolId, {
      roles: ['SECRETAIRE'],
      title: 'Admission refusée',
      body: `${childName} (${trackingRef}) — refus définitif : ${validated.value}`,
      actionPath: `/dashboard/admissions/archived`,
      excludeUserId: access.user.id,
    })

    revalidateAdmissionPaths()
    revalidatePath(`/dashboard/admissions/${requestId}`)
    return { success: true as const }
  }

  if (!meta.class_id || !meta.birth_date || !meta.first_name || !meta.last_name) {
    return { error: 'Dossier incomplet.' }
  }

  const capacity = await checkClassCapacity(access.schoolId, meta.class_id)
  if (!capacity.ok) return { error: capacity.message }

  let generatedIun: string | undefined

  if (current.student_id) {
    // Legacy : élève déjà créé
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: studentError } = await (db as any)
      .from('students')
      .update({ status: 'active' })
      .eq('id', current.student_id)

    if (studentError) return { error: studentError.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from('student_enrollments')
      .update({ status: 'active' })
      .eq('student_id', current.student_id)
  } else {
    const iunResult = await generateIun(meta.birth_date)
    if ('error' in iunResult) return iunResult

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: studentRaw, error: studentError } = await (db as any)
      .from('students')
      .insert({
        school_id: access.schoolId,
        iun: iunResult.iun,
        first_name: meta.first_name,
        last_name: meta.last_name,
        birth_date: meta.birth_date,
        birth_place: meta.birth_place ?? '',
        gender: meta.gender ?? 'M',
        nationality: meta.nationality ?? 'Burkinabè',
        address: meta.address ?? null,
        status: 'active',
      })
      .select('id, iun')
      .single()

    if (studentError || !studentRaw) {
      return { error: studentError?.message ?? 'Erreur création élève.' }
    }

    const { data: classRaw } = await db
      .from('classes')
      .select('school_year_id')
      .eq('id', meta.class_id)
      .limit(1)

    const schoolYearId = (classRaw as Array<{ school_year_id: string }> | null)?.[0]?.school_year_id
    if (!schoolYearId) return { error: 'Année scolaire introuvable.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollmentError } = await (db as any)
      .from('student_enrollments')
      .insert({
        school_id: access.schoolId,
        student_id: studentRaw.id,
        class_id: meta.class_id,
        school_year_id: schoolYearId,
        status: 'active',
      })

    if (enrollmentError) return { error: enrollmentError.message }

    if (meta.parent_first_name && meta.parent_last_name) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from('parent_pre_registrations').insert({
        school_id: access.schoolId,
        first_name: meta.parent_first_name,
        last_name: meta.parent_last_name,
        phone: meta.parent_phone ?? null,
        has_phone: !!meta.parent_phone,
        linked_student_id: studentRaw.id,
        status: 'validated',
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from('student_registration_requests')
      .update({ student_id: studentRaw.id })
      .eq('id', requestId)

    generatedIun = iunResult.iun
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: requestError } = await (db as any)
    .from('student_registration_requests')
    .update({
      status: 'approved',
      metadata: {
        ...current.metadata,
        workflow_status: 'VALIDE',
        decided_by: access.user.id,
        decided_at: new Date().toISOString(),
        generated_iun: generatedIun,
      },
    })
    .eq('id', requestId)

  if (requestError) return { error: requestError.message }

  revalidateAdmissionPaths()
  revalidatePath('/dashboard/finance')
  revalidatePath(`/dashboard/classes/${meta.class_id}`)
  return { success: true as const, iun: generatedIun }
}
