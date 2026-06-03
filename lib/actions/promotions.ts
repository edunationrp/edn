'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  computeStudentPromotionAverage,
  listSchoolYearTerms,
} from '@/lib/promotions/compute-average'
import { proposePromotionStatus } from '@/lib/promotions/propose-status'
import { requirePromotionsManage, requirePromotionsRead } from '@/lib/promotions/access'
import type { PromotionAverageRule, PromotionDecisionStatus, PromotionFinalStatus } from '@/lib/promotions/types'
import { summarizeClassResults, type PromotionResultRow } from '@/lib/promotions/class-summary'

type SchoolPromotionSettings = {
  passingAverage: number
  averageRule: PromotionAverageRule
}

async function loadSchoolPromotionSettings(
  db: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  schoolId: string,
): Promise<SchoolPromotionSettings | { error: string }> {
  const { data, error } = await db
    .from('schools')
    .select('promotion_passing_average, promotion_average_rule')
    .eq('id', schoolId)
    .maybeSingle()

  if (error) return { error: error.message }
  const row = data as {
    promotion_passing_average: number
    promotion_average_rule: PromotionAverageRule
  } | null
  if (!row) return { error: 'Établissement introuvable.' }

  return {
    passingAverage: Number(row.promotion_passing_average) || 10,
    averageRule: row.promotion_average_rule ?? 'last_term',
  }
}

export async function getPromotionSettings() {
  const access = await requirePromotionsRead()
  if ('error' in access) return access

  return loadSchoolPromotionSettings(access.supabase, access.schoolId)
}

export async function updatePromotionSettings(data: {
  passingAverage: number
  averageRule: PromotionAverageRule
}) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  if (data.passingAverage < 0 || data.passingAverage > 20) {
    return { error: 'La moyenne de passage doit être entre 0 et 20.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('schools')
    .update({
      promotion_passing_average: data.passingAverage,
      promotion_average_rule: data.averageRule,
      updated_at: new Date().toISOString(),
    })
    .eq('id', access.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/promotions')
  revalidatePath('/dashboard/settings')
  return { success: true as const }
}

export async function listPromotionSessions() {
  const access = await requirePromotionsRead()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (access.supabase as any)
    .from('promotion_sessions')
    .select('id, label, status, passing_average, average_rule, created_at, source_school_year_id, target_school_year_id')
    .eq('school_id', access.schoolId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }

  const rows = (data ?? []) as Array<{
    id: string
    label: string | null
    status: string
    passing_average: number
    average_rule: string
    created_at: string
    source_school_year_id: string
    target_school_year_id: string | null
  }>

  const yearIds = [
    ...new Set(rows.flatMap(r => [r.source_school_year_id, r.target_school_year_id].filter(Boolean))),
  ] as string[]

  const yearNames = new Map<string, string>()
  if (yearIds.length > 0) {
    const { data: years } = await access.supabase.from('school_years').select('id, name').in('id', yearIds)
    for (const y of (years ?? []) as Array<{ id: string; name: string }>) {
      yearNames.set(y.id, y.name)
    }
  }

  return {
    sessions: rows.map(row => ({
      id: row.id,
      label: row.label,
      status: row.status,
      passingAverage: Number(row.passing_average),
      averageRule: row.average_rule as PromotionAverageRule,
      createdAt: row.created_at,
      sourceYearName: yearNames.get(row.source_school_year_id) ?? '—',
      targetYearName: row.target_school_year_id ? yearNames.get(row.target_school_year_id) ?? null : null,
    })),
  }
}

export async function computePromotionBilan(options?: { sessionId?: string }) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const settings = await loadSchoolPromotionSettings(access.supabase, access.schoolId)
  if ('error' in settings) return settings

  const { data: activeYearRaw } = await access.supabase
    .from('school_years')
    .select('id, name')
    .eq('school_id', access.schoolId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const activeYear = activeYearRaw as { id: string; name: string } | null
  if (!activeYear) {
    return { error: 'Aucune année scolaire active. Configurez le calendrier avant le bilan.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }

  const terms = await listSchoolYearTerms(admin, access.schoolId, activeYear.id)
  const referenceTerm = terms.length > 0 ? terms[terms.length - 1] : null

  let sessionId = options?.sessionId

  if (sessionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from('promotion_sessions')
      .select('id, status, source_school_year_id')
      .eq('id', sessionId)
      .eq('school_id', access.schoolId)
      .maybeSingle()

    if (!existing) return { error: 'Session introuvable.' }
    if ((existing as { status: string }).status === 'applied') {
      return { error: 'Cette session est déjà appliquée et ne peut plus être recalculée.' }
    }

    await admin.from('promotion_results').delete().eq('session_id', sessionId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('promotion_sessions')
      .update({
        passing_average: settings.passingAverage,
        average_rule: settings.averageRule,
        reference_term_id: referenceTerm?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  } else {
    const label = `Bilan ${activeYear.name} — ${new Date().toLocaleDateString('fr-FR')}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: createError } = await (admin as any)
      .from('promotion_sessions')
      .insert({
        school_id: access.schoolId,
        source_school_year_id: activeYear.id,
        status: 'draft',
        label,
        passing_average: settings.passingAverage,
        average_rule: settings.averageRule,
        reference_term_id: referenceTerm?.id ?? null,
        created_by: access.userId,
      })
      .select('id')
      .single()

    if (createError || !created) {
      return { error: createError?.message ?? 'Impossible de créer la session.' }
    }
    sessionId = (created as { id: string }).id
  }

  const { data: levelsRaw } = await admin
    .from('class_levels')
    .select('id, order_num, order_index')
    .eq('school_id', access.schoolId)

  const levels = (levelsRaw ?? []) as Array<{ id: string; order_num: number | null; order_index: number | null }>
  const maxOrder = Math.max(
    0,
    ...levels.map(l => l.order_num ?? l.order_index ?? 0),
  )

  const { data: classesRaw, error: classesError } = await admin
    .from('classes')
    .select('id, name, level_id, class_levels(name, order_num, order_index)')
    .eq('school_id', access.schoolId)
    .eq('school_year_id', activeYear.id)
    .order('name')

  if (classesError) return { error: classesError.message }

  type ClassRow = {
    id: string
    name: string
    level_id: string
    class_levels: { name: string; order_num: number | null; order_index: number | null } | null
  }

  const classes = (classesRaw ?? []) as ClassRow[]
  const resultRows: Array<{
    session_id: string
    school_id: string
    student_id: string
    source_class_id: string
    computed_average: number | null
    proposed_status: PromotionDecisionStatus
    final_status: PromotionFinalStatus
  }> = []

  for (const cls of classes) {
    const levelOrder = cls.class_levels?.order_num ?? cls.class_levels?.order_index ?? 0
    const hasNextLevel = levelOrder < maxOrder

    const { data: enrollments } = await admin
      .from('student_enrollments')
      .select('student_id, students(id, first_name, last_name, iun, status)')
      .eq('school_id', access.schoolId)
      .eq('class_id', cls.id)
      .eq('school_year_id', activeYear.id)
      .eq('status', 'active')

    for (const row of (enrollments ?? []) as Array<{
      student_id: string
      students: {
        id: string
        first_name: string
        last_name: string
        iun: string
        status: string
      } | null
    }>) {
      const student = row.students
      if (!student || student.status !== 'active') continue

      const { average } = await computeStudentPromotionAverage(admin, {
        schoolId: access.schoolId,
        schoolYearId: activeYear.id,
        classId: cls.id,
        studentId: student.id,
        rule: settings.averageRule,
        terms,
      })

      const proposed = proposePromotionStatus({
        average,
        passingAverage: settings.passingAverage,
        hasNextLevel,
      })

      resultRows.push({
        session_id: sessionId!,
        school_id: access.schoolId,
        student_id: student.id,
        source_class_id: cls.id,
        computed_average: average,
        proposed_status: proposed,
        final_status: proposed,
      })
    }
  }

  if (resultRows.length > 0) {
    const chunkSize = 100
    for (let i = 0; i < resultRows.length; i += chunkSize) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (admin as any)
        .from('promotion_results')
        .insert(resultRows.slice(i, i + chunkSize))
      if (insertError) return { error: insertError.message }
    }
  }

  revalidatePath('/dashboard/promotions')
  revalidatePath('/dashboard/promotions')
  revalidatePath(`/dashboard/promotions/${sessionId}`)
  revalidatePath(`/dashboard/promotions/${sessionId}/structure`)
  return { success: true as const, sessionId: sessionId! }
}

export async function getPromotionSessionDetail(sessionId: string, classFilter?: string) {
  const access = await requirePromotionsRead()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionRaw, error: sessionError } = await (access.supabase as any)
    .from('promotion_sessions')
    .select('id, label, status, passing_average, average_rule, created_at, source_school_year_id, target_school_year_id')
    .eq('id', sessionId)
    .eq('school_id', access.schoolId)
    .maybeSingle()

  if (sessionError) return { error: sessionError.message }
  if (!sessionRaw) return { error: 'Session introuvable.' }

  const sessionRow = sessionRaw as {
    id: string
    label: string | null
    status: string
    passing_average: number
    average_rule: PromotionAverageRule
    created_at: string
    source_school_year_id: string
    target_school_year_id: string | null
  }

  const yearIds = [sessionRow.source_school_year_id, sessionRow.target_school_year_id].filter(
    Boolean,
  ) as string[]
  const yearNames = new Map<string, string>()
  if (yearIds.length > 0) {
    const { data: years } = await access.supabase.from('school_years').select('id, name').in('id', yearIds)
    for (const y of (years ?? []) as Array<{ id: string; name: string }>) {
      yearNames.set(y.id, y.name)
    }
  }

  let targetClassCount = 0
  if (sessionRow.target_school_year_id) {
    const { count } = await access.supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', access.schoolId)
      .eq('school_year_id', sessionRow.target_school_year_id)
    targetClassCount = count ?? 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: mappingCount } = await (access.supabase as any)
    .from('promotion_class_mappings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const session = {
    ...sessionRow,
    sourceYearName: yearNames.get(sessionRow.source_school_year_id) ?? '—',
    targetYearName: sessionRow.target_school_year_id
      ? yearNames.get(sessionRow.target_school_year_id) ?? null
      : null,
    structureReady: !!sessionRow.target_school_year_id && targetClassCount > 0,
    mappingsReady: (mappingCount ?? 0) > 0,
  }

  const { data: resultsRaw, error: resultsError } = await access.supabase
    .from('promotion_results')
    .select(`
      id, student_id, source_class_id, computed_average,
      proposed_status, final_status, override_reason,
      students(first_name, last_name, iun),
      classes(name, class_levels(name))
    `)
    .eq('session_id', sessionId)
    .eq('school_id', access.schoolId)
    .order('computed_average', { ascending: false, nullsFirst: false })

  if (resultsError) return { error: resultsError.message }

  const allParsed = ((resultsRaw ?? []) as Array<{
    id: string
    student_id: string
    source_class_id: string
    computed_average: number | null
    proposed_status: PromotionDecisionStatus
    final_status: PromotionFinalStatus
    override_reason: string | null
    students: { first_name: string; last_name: string; iun: string } | null
    classes: { name: string; class_levels: { name: string } | null } | null
  }>).map(row => ({
    id: row.id,
    studentId: row.student_id,
    sourceClassId: row.source_class_id,
    firstName: row.students?.first_name ?? '',
    lastName: row.students?.last_name ?? '',
    iun: row.students?.iun ?? '',
    className: row.classes?.name ?? '—',
    levelName: row.classes?.class_levels?.name ?? null,
    computedAverage: row.computed_average !== null ? Number(row.computed_average) : null,
    proposedStatus: row.proposed_status,
    finalStatus: row.final_status,
    overrideReason: row.override_reason,
  }))

  const byClass = new Map<string, PromotionResultRow[]>()
  for (const row of allParsed) {
    const list = byClass.get(row.sourceClassId) ?? []
    list.push({
      studentId: row.studentId,
      firstName: row.firstName,
      lastName: row.lastName,
      iun: row.iun,
      computedAverage: row.computedAverage,
      proposedStatus: row.proposedStatus,
      finalStatus: row.finalStatus,
      overrideReason: row.overrideReason,
    })
    byClass.set(row.sourceClassId, list)
  }

  const classSummaries: ReturnType<typeof summarizeClassResults>[] = []
  const classMeta = new Map<string, { className: string; levelName: string | null }>()
  for (const row of allParsed) {
    if (!classMeta.has(row.sourceClassId)) {
      classMeta.set(row.sourceClassId, { className: row.className, levelName: row.levelName })
    }
  }

  for (const [classId, meta] of classMeta) {
    classSummaries.push(
      summarizeClassResults(
        { classId, className: meta.className, levelName: meta.levelName },
        byClass.get(classId) ?? [],
      ),
    )
  }

  classSummaries.sort((a, b) => a.className.localeCompare(b.className, 'fr'))

  const allRows: PromotionResultRow[] = []
  for (const rows of byClass.values()) allRows.push(...rows)
  const schoolSummary = {
    total: allRows.length,
    admitted: classSummaries.reduce((s, c) => s + c.admitted, 0),
    repeat: classSummaries.reduce((s, c) => s + c.repeat, 0),
    graduate: classSummaries.reduce((s, c) => s + c.graduate, 0),
    incomplete: classSummaries.reduce((s, c) => s + c.incomplete, 0),
    successRate:
      allRows.length > 0
        ? Math.round(
            ((classSummaries.reduce((s, c) => s + c.admitted + c.graduate, 0)) /
              Math.max(1, allRows.length - classSummaries.reduce((s, c) => s + c.incomplete, 0))) *
              1000,
          ) / 10
        : null,
  }

  const classOptions = classSummaries.map(c => ({
    id: c.classId,
    name: c.className,
    levelName: c.levelName,
  }))

  return {
    session: {
      id: session.id,
      label: session.label,
      status: session.status,
      passingAverage: Number(session.passing_average),
      averageRule: session.average_rule,
      createdAt: session.created_at,
      sourceYearName: session.sourceYearName,
      targetYearName: session.targetYearName,
      structureReady: session.structureReady,
      mappingsReady: session.mappingsReady,
    },
    classSummaries,
    classOptions,
    students: allParsed,
    schoolSummary,
  }
}

export async function overridePromotionResult(data: {
  resultId: string
  finalStatus: PromotionDecisionStatus
  reason?: string
}) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: fetchError } = await (access.supabase as any)
    .from('promotion_results')
    .select('id, session_id, school_id')
    .eq('id', data.resultId)
    .eq('school_id', access.schoolId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!row) return { error: 'Résultat introuvable.' }

  const resultRow = row as { session_id: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionCheck } = await (access.supabase as any)
    .from('promotion_sessions')
    .select('status')
    .eq('id', resultRow.session_id)
    .maybeSingle()

  if ((sessionCheck as { status: string } | null)?.status === 'applied') {
    return { error: 'Session déjà appliquée : modification impossible.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('promotion_results')
    .update({
      final_status: data.finalStatus,
      override_reason: data.reason?.trim() || null,
      overridden_by: access.userId,
      overridden_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.resultId)

  if (error) return { error: error.message }

  const sessionId = resultRow.session_id
  revalidatePath('/dashboard/promotions')
  revalidatePath(`/dashboard/promotions/${sessionId}`)
  return { success: true as const }
}

export async function deletePromotionSession(sessionId: string) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('promotion_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('school_id', access.schoolId)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/promotions')
  return { success: true as const }
}
