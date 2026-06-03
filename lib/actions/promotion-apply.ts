'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePromotionsManage, requirePromotionsRead } from '@/lib/promotions/access'
import { getPromotionClassMappings } from '@/lib/actions/promotion-structure'
import {
  effectivePromotionStatus,
  resolveTargetClassId,
  sourceEnrollmentStatusAfterApply,
  type ApplyPreviewRow,
  type ApplyPreviewSummary,
  type ClassMappingRow,
} from '@/lib/promotions/resolve-apply'
import type { PromotionDecisionStatus, PromotionFinalStatus } from '@/lib/promotions/types'

type SessionRow = {
  id: string
  status: string
  school_id: string
  source_school_year_id: string
  target_school_year_id: string | null
}

async function loadSession(
  db: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  schoolId: string,
  sessionId: string,
): Promise<SessionRow | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from('promotion_sessions')
    .select('id, status, school_id, source_school_year_id, target_school_year_id')
    .eq('id', sessionId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Session introuvable.' }
  return data as SessionRow
}

async function buildApplyPlan(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
  session: SessionRow,
) {
  if (!session.target_school_year_id) {
    return { error: 'Année cible non configurée.' as const }
  }

  const mappingsResult = await getPromotionClassMappings(session.id)
  if ('error' in mappingsResult) return mappingsResult

  if (!mappingsResult.allMapped) {
    return { error: 'Correspondances incomplètes. Terminez l\'étape « Préparer la rentrée ».' as const }
  }

  const mappingBySource = new Map<string, ClassMappingRow>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: savedMappings } = await (admin as any)
    .from('promotion_class_mappings')
    .select('source_class_id, target_class_id, repeat_target_class_id')
    .eq('session_id', session.id)

  for (const row of (savedMappings ?? []) as ClassMappingRow[]) {
    mappingBySource.set(row.source_class_id, row)
  }

  const { data: resultsRaw } = await admin
    .from('promotion_results')
    .select(`
      student_id, source_class_id, proposed_status, final_status,
      students(first_name, last_name, iun),
      classes(name)
    `)
    .eq('session_id', session.id)
    .eq('school_id', schoolId)

  const results = (resultsRaw ?? []) as Array<{
    student_id: string
    source_class_id: string
    proposed_status: PromotionDecisionStatus
    final_status: PromotionFinalStatus
    students: { first_name: string; last_name: string; iun: string } | null
    classes: { name: string } | null
  }>

  const { data: existingTargetEnrollments } = await admin
    .from('student_enrollments')
    .select('student_id')
    .eq('school_id', schoolId)
    .eq('school_year_id', session.target_school_year_id)

  const alreadyInTargetYear = new Set(
    ((existingTargetEnrollments ?? []) as Array<{ student_id: string }>).map(r => r.student_id),
  )

  const { data: sourceEnrollments } = await admin
    .from('student_enrollments')
    .select('id, student_id, class_id, status')
    .eq('school_id', schoolId)
    .eq('school_year_id', session.source_school_year_id)

  const sourceEnrollmentKey = new Map<string, string>()
  for (const e of (sourceEnrollments ?? []) as Array<{
    id: string
    student_id: string
    class_id: string
    status: string
  }>) {
    sourceEnrollmentKey.set(`${e.student_id}:${e.class_id}`, e.id)
  }

  const targetClassIds = [
    ...new Set(
      [...mappingBySource.values()].flatMap(m => [m.target_class_id, m.repeat_target_class_id].filter(Boolean)),
    ),
  ] as string[]

  const targetClassNames = new Map<string, string>()
  if (targetClassIds.length > 0) {
    const { data: classes } = await admin.from('classes').select('id, name').in('id', targetClassIds)
    for (const c of (classes ?? []) as Array<{ id: string; name: string }>) {
      targetClassNames.set(c.id, c.name)
    }
  }

  const rows: ApplyPreviewRow[] = []
  const blockers: string[] = []

  for (const row of results) {
    const decision = effectivePromotionStatus(row.proposed_status, row.final_status)
    const name = row.students
      ? `${row.students.last_name} ${row.students.first_name}`
      : 'Élève'
    const mapping = mappingBySource.get(row.source_class_id)
    const targetClassId = resolveTargetClassId(decision, mapping)
    const targetClassName = targetClassId ? targetClassNames.get(targetClassId) ?? '—' : null

    if (decision === 'incomplete') {
      rows.push({
        studentId: row.student_id,
        studentName: name,
        iun: row.students?.iun ?? '',
        sourceClassName: row.classes?.name ?? '—',
        decision,
        targetClassName: null,
        action: 'skip_incomplete',
      })
      continue
    }

    if (!sourceEnrollmentKey.has(`${row.student_id}:${row.source_class_id}`)) {
      rows.push({
        studentId: row.student_id,
        studentName: name,
        iun: row.students?.iun ?? '',
        sourceClassName: row.classes?.name ?? '—',
        decision,
        targetClassName: targetClassName,
        action: 'error',
        error: 'Inscription source introuvable pour cette classe.',
      })
      continue
    }

    if (decision === 'graduate') {
      rows.push({
        studentId: row.student_id,
        studentName: name,
        iun: row.students?.iun ?? '',
        sourceClassName: row.classes?.name ?? '—',
        decision,
        targetClassName: null,
        action: 'graduate',
      })
      continue
    }

    if (!targetClassId) {
      rows.push({
        studentId: row.student_id,
        studentName: name,
        iun: row.students?.iun ?? '',
        sourceClassName: row.classes?.name ?? '—',
        decision,
        targetClassName: null,
        action: 'error',
        error: 'Classe cible manquante pour cette décision.',
      })
      continue
    }

    if (alreadyInTargetYear.has(row.student_id)) {
      rows.push({
        studentId: row.student_id,
        studentName: name,
        iun: row.students?.iun ?? '',
        sourceClassName: row.classes?.name ?? '—',
        decision,
        targetClassName,
        action: 'error',
        error: 'Déjà inscrit sur l\'année de rentrée.',
      })
      continue
    }

    rows.push({
      studentId: row.student_id,
      studentName: name,
      iun: row.students?.iun ?? '',
      sourceClassName: row.classes?.name ?? '—',
      decision,
      targetClassName,
      action: 'enroll',
    })
  }

  const incompleteCount = rows.filter(r => r.action === 'skip_incomplete').length
  const errorCount = rows.filter(r => r.action === 'error').length
  const enrollCount = rows.filter(r => r.action === 'enroll').length
  const graduateCount = rows.filter(r => r.action === 'graduate').length
  const admittedCount = rows.filter(r => r.decision === 'admitted' && r.action === 'enroll').length
  const repeatCount = rows.filter(r => r.decision === 'repeat' && r.action === 'enroll').length

  if (incompleteCount > 0) {
    blockers.push(`${incompleteCount} élève(s) avec notes ou décision incomplète.`)
  }
  if (errorCount > 0) {
    blockers.push(`${errorCount} élève(s) en erreur (classe manquante ou doublon).`)
  }
  if (results.length === 0) {
    blockers.push('Aucun résultat de bilan — recalculez le bilan d\'abord.')
  }

  const summary: ApplyPreviewSummary = {
    enrollCount,
    graduateCount,
    repeatCount,
    admittedCount,
    incompleteCount,
    errorCount,
    canApply: blockers.length === 0 && session.status === 'draft',
    blockers,
  }

  return { session, mappingBySource, rows, summary, results }
}

export async function getPromotionApplyPreview(sessionId: string) {
  const access = await requirePromotionsRead()
  if ('error' in access) return access

  const session = await loadSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const plan = await buildApplyPlan(admin, access.schoolId, session)
  if ('error' in plan && !('summary' in plan)) return plan

  const { data: targetYear } = await access.supabase
    .from('school_years')
    .select('name')
    .eq('id', session.target_school_year_id!)
    .maybeSingle()

  return {
    sessionId,
    sessionStatus: session.status,
    targetYearName: (targetYear as { name: string } | null)?.name ?? '—',
    summary: plan.summary,
    rows: plan.rows.slice(0, 200),
    totalRows: plan.rows.length,
  }
}

export async function applyPromotionSession(sessionId: string) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const session = await loadSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  if (session.status !== 'draft') {
    return { error: 'Ce bilan a déjà été appliqué.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const plan = await buildApplyPlan(admin, access.schoolId, session)
  if ('error' in plan && !('summary' in plan)) return plan

  if (!plan.summary.canApply) {
    return { error: plan.summary.blockers.join(' ') || 'Application impossible.' }
  }

  const now = new Date().toISOString()
  let promoted = 0
  let enrolled = 0
  let graduated = 0

  for (const preview of plan.rows) {
    const raw = plan.results.find(r => r.student_id === preview.studentId)
    if (!raw) continue

    const decision = effectivePromotionStatus(raw.proposed_status, raw.final_status)
    const mapping = plan.mappingBySource.get(raw.source_class_id)

    const { data: sourceEnrollment } = await admin
      .from('student_enrollments')
      .select('id, status')
      .eq('school_id', access.schoolId)
      .eq('student_id', preview.studentId)
      .eq('school_year_id', session.source_school_year_id)
      .eq('class_id', raw.source_class_id)
      .maybeSingle()

    const sourceEnrollmentId = (sourceEnrollment as { id: string } | null)?.id

    if (decision === 'incomplete') continue

    const newSourceStatus = sourceEnrollmentStatusAfterApply(decision)

    if (sourceEnrollmentId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('student_enrollments')
        .update({ status: newSourceStatus })
        .eq('id', sourceEnrollmentId)
    }

    if (decision === 'graduate') {
      graduated += 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('promotion_apply_logs').insert({
        session_id: sessionId,
        school_id: access.schoolId,
        student_id: preview.studentId,
        source_enrollment_id: sourceEnrollmentId,
        decision,
        source_class_id: raw.source_class_id,
        target_class_id: null,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('promotion_results')
        .update({ applied_at: now, applied_target_class_id: null })
        .eq('session_id', sessionId)
        .eq('student_id', preview.studentId)
      continue
    }

    const targetClassId = resolveTargetClassId(decision, mapping)
    if (!targetClassId) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newEnrollment, error: insertError } = await (admin as any)
      .from('student_enrollments')
      .insert({
        school_id: access.schoolId,
        student_id: preview.studentId,
        class_id: targetClassId,
        school_year_id: session.target_school_year_id,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError) {
      return { error: `Élève ${preview.studentName} : ${insertError.message}` }
    }

    enrolled += 1
    promoted += 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('promotion_apply_logs').insert({
      session_id: sessionId,
      school_id: access.schoolId,
      student_id: preview.studentId,
      source_enrollment_id: sourceEnrollmentId,
      target_enrollment_id: (newEnrollment as { id: string }).id,
      decision,
      source_class_id: raw.source_class_id,
      target_class_id: targetClassId,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('promotion_results')
      .update({ applied_at: now, applied_target_class_id: targetClassId })
      .eq('session_id', sessionId)
      .eq('student_id', preview.studentId)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('promotion_sessions')
    .update({
      status: 'applied',
      applied_at: now,
      updated_at: now,
    })
    .eq('id', sessionId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('audit_logs').insert({
    school_id: access.schoolId,
    actor_id: access.userId,
    action: 'promotion.apply',
    entity_type: 'promotion_session',
    entity_id: sessionId,
    new_data: {
      enrolled,
      graduated,
      source_school_year_id: session.source_school_year_id,
      target_school_year_id: session.target_school_year_id,
    },
  })

  revalidatePath('/dashboard/promotions')
  revalidatePath(`/dashboard/promotions/${sessionId}`)
  revalidatePath(`/dashboard/promotions/${sessionId}/structure`)
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/classes')

  return {
    success: true as const,
    enrolled,
    graduated,
    promoted,
  }
}
