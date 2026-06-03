'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePromotionsManage, requirePromotionsRead } from '@/lib/promotions/access'
import { duplicateClassesToTargetYear } from '@/lib/promotions/clone-structure'
import { suggestNextSchoolYearLabel } from '@/lib/promotions/class-keys'
import { buildMappingSuggestions } from '@/lib/promotions/suggest-mappings'
import { parseSchoolYearDates } from '@/lib/onboarding/constants'
import type { PromotionDecisionStatus } from '@/lib/promotions/types'

type SessionRow = {
  id: string
  status: string
  source_school_year_id: string
  target_school_year_id: string | null
  school_id: string
}

async function loadDraftSession(
  db: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  schoolId: string,
  sessionId: string,
): Promise<SessionRow | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from('promotion_sessions')
    .select('id, status, source_school_year_id, target_school_year_id, school_id')
    .eq('id', sessionId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Session introuvable.' }
  const row = data as SessionRow
  if (row.status !== 'draft') return { error: 'Session verrouillée : modification impossible.' }
  return row
}

async function createTermsForYear(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
  schoolYearId: string,
  startDate: string,
  endDate: string,
) {
  const { data: schoolRaw } = await admin.from('schools').select('academic_format').eq('id', schoolId).maybeSingle()
  const academicFormat = (schoolRaw as { academic_format: string } | null)?.academic_format ?? 'trimestre'
  const termCount = academicFormat === 'semestre' ? 2 : academicFormat === 'annuel' ? 1 : 3
  const termType = academicFormat === 'semestre' ? 'semestre' : academicFormat === 'annuel' ? 'annuel' : 'trimestre'

  const startYear = new Date(startDate).getFullYear()
  const endYear = new Date(endDate).getFullYear()
  const totalMonths = Math.max(1, (endYear - startYear) * 12)
  const monthsPerTerm = Math.max(1, Math.floor(totalMonths / termCount))

  for (let i = 0; i < termCount; i++) {
    const termStart = new Date(startDate)
    termStart.setMonth(termStart.getMonth() + i * monthsPerTerm)
    const termEnd = new Date(termStart)
    termEnd.setMonth(termEnd.getMonth() + monthsPerTerm)
    if (i === termCount - 1) termEnd.setTime(new Date(endDate).getTime())

    const label =
      termType === 'semestre'
        ? `Semestre ${i + 1}`
        : termType === 'annuel'
          ? 'Année scolaire'
          : `Trimestre ${i + 1}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('terms').insert({
      school_id: schoolId,
      school_year_id: schoolYearId,
      name: label,
      type: termType,
      start_date: termStart.toISOString().slice(0, 10),
      end_date: termEnd.toISOString().slice(0, 10),
      is_active: i === 0,
    })
  }
}

function effectiveStatus(
  proposed: PromotionDecisionStatus,
  final: PromotionDecisionStatus | 'pending',
): PromotionDecisionStatus {
  return final === 'pending' ? proposed : (final as PromotionDecisionStatus)
}

export async function getPromotionStructureSetup(sessionId: string) {
  const access = await requirePromotionsRead()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionRaw, error: sessionErr } = await (access.supabase as any)
    .from('promotion_sessions')
    .select('id, status, source_school_year_id, target_school_year_id, school_id')
    .eq('id', sessionId)
    .eq('school_id', access.schoolId)
    .maybeSingle()

  if (sessionErr) return { error: sessionErr.message }
  if (!sessionRaw) return { error: 'Session introuvable.' }

  const session = sessionRaw as SessionRow

  const { data: years } = await access.supabase
    .from('school_years')
    .select('id, name, start_date, end_date, is_active')
    .eq('school_id', access.schoolId)
    .order('start_date', { ascending: false })

  const schoolYears = (years ?? []) as Array<{
    id: string
    name: string
    start_date: string
    end_date: string
    is_active: boolean
  }>

  const sourceYear = schoolYears.find(y => y.id === session.source_school_year_id)
  const suggestedYearName = sourceYear ? suggestNextSchoolYearLabel(sourceYear.name) : suggestNextSchoolYearLabel('')

  let targetClassCount = 0
  if (session.target_school_year_id) {
    const { count } = await access.supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', access.schoolId)
      .eq('school_year_id', session.target_school_year_id)
    targetClassCount = count ?? 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: mappingCount } = await (access.supabase as any)
    .from('promotion_class_mappings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const targetYear = session.target_school_year_id
    ? schoolYears.find(y => y.id === session.target_school_year_id)
    : null

  return {
    sessionId,
    sessionStatus: session.status,
    sourceYearId: session.source_school_year_id,
    sourceYearName: sourceYear?.name ?? '—',
    targetYearId: session.target_school_year_id,
    targetYearName: targetYear?.name ?? null,
    suggestedYearName,
    schoolYears: schoolYears.map(y => ({
      id: y.id,
      name: y.name,
      isActive: y.is_active,
      isSource: y.id === session.source_school_year_id,
    })),
    targetClassCount,
    mappingCount: mappingCount ?? 0,
    structureReady: !!session.target_school_year_id && targetClassCount > 0,
    mappingsReady: (mappingCount ?? 0) > 0,
  }
}

export async function linkPromotionTargetYear(sessionId: string, targetSchoolYearId: string) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const session = await loadDraftSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  if (targetSchoolYearId === session.source_school_year_id) {
    return { error: 'L\'année cible doit être différente de l\'année du bilan.' }
  }

  const { data: year } = await access.supabase
    .from('school_years')
    .select('id')
    .eq('id', targetSchoolYearId)
    .eq('school_id', access.schoolId)
    .maybeSingle()

  if (!year) return { error: 'Année scolaire cible introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('promotion_sessions')
    .update({
      target_school_year_id: targetSchoolYearId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/promotions/${sessionId}`)
  revalidatePath(`/dashboard/promotions/${sessionId}/structure`)
  return { success: true as const }
}

export async function createPromotionTargetYear(
  sessionId: string,
  data: { name: string; startDate?: string; endDate?: string },
) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const session = await loadDraftSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  if (!data.name.trim()) return { error: 'Libellé de l\'année requis.' }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const parsed = parseSchoolYearDates(data.name.trim())
  const startDate = data.startDate || parsed.start_date
  const endDate = data.endDate || parsed.end_date

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: yearError } = await (admin as any)
    .from('school_years')
    .insert({
      school_id: access.schoolId,
      name: data.name.trim(),
      start_date: startDate,
      end_date: endDate,
      is_active: false,
    })
    .select('id')
    .single()

  if (yearError || !inserted) {
    return { error: yearError?.message ?? 'Impossible de créer l\'année scolaire.' }
  }

  const yearId = (inserted as { id: string }).id
  await createTermsForYear(admin, access.schoolId, yearId, startDate, endDate)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('promotion_sessions')
    .update({
      target_school_year_id: yearId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  revalidatePath(`/dashboard/promotions/${sessionId}/structure`)
  revalidatePath('/dashboard/settings')
  return { success: true as const, targetSchoolYearId: yearId }
}

export async function duplicatePromotionStructure(sessionId: string) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const session = await loadDraftSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  if (!session.target_school_year_id) {
    return { error: 'Sélectionnez ou créez d\'abord l\'année scolaire cible.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const result = await duplicateClassesToTargetYear(
    admin,
    access.schoolId,
    session.source_school_year_id,
    session.target_school_year_id,
  )

  if ('error' in result) return result

  revalidatePath(`/dashboard/promotions/${sessionId}/structure`)
  if (result.created === 0 && result.skipped > 0) {
    return {
      success: true as const,
      created: 0,
      skipped: result.skipped,
      message: `L'année cible contient déjà ${result.skipped} classe(s).`,
    }
  }
  return { success: true as const, created: result.created, skipped: result.skipped }
}

async function loadMappingContext(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
  session: SessionRow,
) {
  const { data: levelsRaw } = await admin
    .from('class_levels')
    .select('id, name, order_num, order_index')
    .eq('school_id', schoolId)

  const levels = ((levelsRaw ?? []) as Array<{
    id: string
    name: string
    order_num: number | null
    order_index: number | null
  }>).map(l => ({
    id: l.id,
    name: l.name,
    order: l.order_num ?? l.order_index ?? 0,
  }))

  const classSelect = 'id, name, level_id, capacity, series, class_levels(name, order_num, order_index)'

  const { data: sourceClasses } = await admin
    .from('classes')
    .select(classSelect)
    .eq('school_id', schoolId)
    .eq('school_year_id', session.source_school_year_id)
    .order('name')

  const targetYearId = session.target_school_year_id
  const { data: targetClasses } = targetYearId
    ? await admin
        .from('classes')
        .select(classSelect)
        .eq('school_id', schoolId)
        .eq('school_year_id', targetYearId)
        .order('name')
    : { data: [] }

  const { data: resultsRaw } = await admin
    .from('promotion_results')
    .select('source_class_id, proposed_status, final_status')
    .eq('session_id', session.id)

  const admittedByClass = new Map<string, number>()
  const repeatByClass = new Map<string, number>()

  for (const row of (resultsRaw ?? []) as Array<{
    source_class_id: string
    proposed_status: PromotionDecisionStatus
    final_status: PromotionDecisionStatus | 'pending'
  }>) {
    const status = effectiveStatus(row.proposed_status, row.final_status)
    if (status === 'admitted') {
      admittedByClass.set(row.source_class_id, (admittedByClass.get(row.source_class_id) ?? 0) + 1)
    }
    if (status === 'repeat') {
      repeatByClass.set(row.source_class_id, (repeatByClass.get(row.source_class_id) ?? 0) + 1)
    }
  }

  return {
    levels,
    sourceClasses: sourceClasses ?? [],
    targetClasses: targetClasses ?? [],
    admittedByClass,
    repeatByClass,
  }
}

export async function getPromotionClassMappings(sessionId: string) {
  const access = await requirePromotionsRead()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionRaw, error: sessionError } = await (access.supabase as any)
    .from('promotion_sessions')
    .select('id, status, source_school_year_id, target_school_year_id, school_id')
    .eq('id', sessionId)
    .eq('school_id', access.schoolId)
    .maybeSingle()

  if (sessionError) return { error: sessionError.message }
  if (!sessionRaw) return { error: 'Session introuvable.' }

  const sessionRow = sessionRaw as SessionRow

  if (!sessionRow.target_school_year_id) {
    return { error: 'Année cible non configurée. Préparez la rentrée d\'abord.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const ctx = await loadMappingContext(admin, access.schoolId, sessionRow)

  const suggestions = buildMappingSuggestions({
    sourceClasses: ctx.sourceClasses as Parameters<typeof buildMappingSuggestions>[0]['sourceClasses'],
    targetClasses: ctx.targetClasses as Parameters<typeof buildMappingSuggestions>[0]['targetClasses'],
    levels: ctx.levels,
    admittedByClass: ctx.admittedByClass,
    repeatByClass: ctx.repeatByClass,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: savedRaw } = await (admin as any)
    .from('promotion_class_mappings')
    .select('source_class_id, target_class_id, repeat_target_class_id')
    .eq('session_id', sessionId)

  const saved = new Map(
    ((savedRaw ?? []) as Array<{
      source_class_id: string
      target_class_id: string | null
      repeat_target_class_id: string | null
    }>).map(row => [row.source_class_id, row]),
  )

  const targetOptions = (ctx.targetClasses as Array<{
    id: string
    name: string
    level_id: string
    class_levels: { name: string } | null
  }>).map(c => ({
    id: c.id,
    name: c.name,
    levelName: c.class_levels?.name ?? '',
    levelId: c.level_id,
  }))

  const rows = suggestions.map(s => {
    const persisted = saved.get(s.sourceClassId)
    return {
      ...s,
      targetClassId: persisted?.target_class_id ?? s.targetClassId,
      repeatTargetClassId: persisted?.repeat_target_class_id ?? s.repeatTargetClassId,
    }
  })

  return {
    sessionId,
    targetYearId: sessionRow.target_school_year_id,
    rows,
    targetOptions,
    allMapped: rows.every(r => {
      if (r.admittedCount > 0 && r.hasNextLevel && !r.targetClassId) return false
      if (r.repeatCount > 0 && !r.repeatTargetClassId) return false
      return true
    }),
    warningCount: rows.reduce((n, r) => n + r.warnings.length, 0),
  }
}

export async function suggestAndSavePromotionMappings(sessionId: string) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const session = await loadDraftSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  if (!session.target_school_year_id) {
    return { error: 'Année cible non configurée.' }
  }

  const mappings = await getPromotionClassMappings(sessionId)
  if ('error' in mappings) return mappings

  return savePromotionClassMappings(
    sessionId,
    mappings.rows.map(r => ({
      sourceClassId: r.sourceClassId,
      targetClassId: r.targetClassId,
      repeatTargetClassId: r.repeatTargetClassId,
    })),
  )
}

export async function savePromotionClassMappings(
  sessionId: string,
  mappings: Array<{
    sourceClassId: string
    targetClassId: string | null
    repeatTargetClassId: string | null
  }>,
) {
  const access = await requirePromotionsManage()
  if ('error' in access) return access

  const session = await loadDraftSession(access.supabase, access.schoolId, sessionId)
  if ('error' in session) return session

  if (!session.target_school_year_id) {
    return { error: 'Année cible non configurée.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const { data: targetClassesRaw } = await admin
    .from('classes')
    .select('id')
    .eq('school_year_id', session.target_school_year_id)

  const targetClassIds = new Set(
    ((targetClassesRaw ?? []) as Array<{ id: string }>).map(c => c.id),
  )

  for (const row of mappings) {
    if (row.targetClassId && !targetClassIds.has(row.targetClassId)) {
      return { error: 'Une classe cible n\'appartient pas à l\'année de rentrée.' }
    }
    if (row.repeatTargetClassId && !targetClassIds.has(row.repeatTargetClassId)) {
      return { error: 'Une classe redoublement n\'appartient pas à l\'année de rentrée.' }
    }
  }

  await admin.from('promotion_class_mappings').delete().eq('session_id', sessionId)

  if (mappings.length > 0) {
    const inserts = mappings.map(row => ({
      session_id: sessionId,
      school_id: access.schoolId,
      source_class_id: row.sourceClassId,
      target_class_id: row.targetClassId,
      repeat_target_class_id: row.repeatTargetClassId,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('promotion_class_mappings').insert(inserts)
    if (error) return { error: error.message }
  }

  revalidatePath(`/dashboard/promotions/${sessionId}`)
  revalidatePath(`/dashboard/promotions/${sessionId}/structure`)
  return { success: true as const }
}
