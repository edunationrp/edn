import type { SupabaseClient } from '@supabase/supabase-js'
import { getDefaultClassLevelNames } from '@/lib/schools/default-class-levels'

type SeedResult =
  | { seeded: false; count: number }
  | { seeded: true; count: number }
  | { error: string }

/** Crée les niveaux par défaut si l'établissement n'en a aucun. */
export async function ensureDefaultClassLevels(
  supabase: SupabaseClient,
  schoolId: string,
  schoolType: string,
): Promise<SeedResult> {
  const { count, error: countError } = await supabase
    .from('class_levels')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  if (countError) return { error: countError.message }
  if ((count ?? 0) > 0) return { seeded: false, count: count ?? 0 }

  const names = getDefaultClassLevelNames(schoolType)
  if (names.length === 0) return { seeded: false, count: 0 }

  const rows = names.map((name, index) => ({
    school_id: schoolId,
    name,
    order_index: index + 1,
    order_num: index + 1,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('class_levels').insert(rows)
  if (error) return { error: error.message }

  return { seeded: true, count: names.length }
}
