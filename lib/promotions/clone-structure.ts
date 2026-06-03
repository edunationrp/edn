import type { SupabaseClient } from '@supabase/supabase-js'

export type ClassCloneRow = {
  id: string
  name: string
  level_id: string
  capacity: number | null
  series: string | null
}

/**
 * Duplique les classes d'une année source vers une année cible (sans élèves).
 */
export async function duplicateClassesToTargetYear(
  admin: SupabaseClient,
  schoolId: string,
  sourceSchoolYearId: string,
  targetSchoolYearId: string,
): Promise<{ created: number; skipped: number } | { error: string }> {
  const { count: existingCount } = await admin
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('school_year_id', targetSchoolYearId)

  if ((existingCount ?? 0) > 0) {
    return { created: 0, skipped: existingCount ?? 0 }
  }

  const { data: sourceClasses, error: fetchError } = await admin
    .from('classes')
    .select('id, name, level_id, capacity, series')
    .eq('school_id', schoolId)
    .eq('school_year_id', sourceSchoolYearId)
    .order('name')

  if (fetchError) return { error: fetchError.message }

  const rows = (sourceClasses ?? []) as ClassCloneRow[]
  if (rows.length === 0) return { created: 0, skipped: 0 }

  const inserts = rows.map(row => ({
    school_id: schoolId,
    school_year_id: targetSchoolYearId,
    level_id: row.level_id,
    name: row.name,
    capacity: row.capacity,
    series: row.series,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (admin as any).from('classes').insert(inserts)
  if (insertError) return { error: insertError.message }

  const sourceIds = rows.map(r => r.id)
  const { data: newClasses } = await admin
    .from('classes')
    .select('id, name, level_id')
    .eq('school_id', schoolId)
    .eq('school_year_id', targetSchoolYearId)

  const newRows = (newClasses ?? []) as Array<{ id: string; name: string; level_id: string }>

  const { data: classSubjects } = await admin
    .from('class_subjects')
    .select('class_id, subject_id, coefficient')
    .eq('school_id', schoolId)
    .in('class_id', sourceIds)

  if ((classSubjects ?? []).length > 0) {
    const nameToNewId = new Map(
      newRows.map(c => [`${c.level_id}::${c.name}`, c.id]),
    )
    const oldToNew = new Map<string, string>()
    for (const src of rows) {
      const key = `${src.level_id}::${src.name}`
      const newId = nameToNewId.get(key)
      if (newId) oldToNew.set(src.id, newId)
    }

    const subjectInserts = ((classSubjects ?? []) as Array<{
      class_id: string
      subject_id: string
      coefficient: number
    }>)
      .map(cs => {
        const newClassId = oldToNew.get(cs.class_id)
        if (!newClassId) return null
        return {
          school_id: schoolId,
          class_id: newClassId,
          subject_id: cs.subject_id,
          coefficient: cs.coefficient,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (subjectInserts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('class_subjects').insert(subjectInserts)
    }
  }

  return { created: rows.length, skipped: 0 }
}
