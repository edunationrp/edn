import type { SupabaseClient } from '@supabase/supabase-js'
import {
  QA_DEMO_SCHOOL_ID,
  QA_DEMO_SCHOOL_NAME,
} from '@/lib/platform/qa-demo-school'

type EnsureResult =
  | { ok: true; created: boolean; studentCount: number }
  | { error: string }

/** Vérifie / complète l'école démo si la migration n'a pas encore été appliquée. */
export async function ensureQaDemoSchoolData(
  admin: SupabaseClient,
): Promise<EnsureResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: existingRaw } = await db
    .from('schools')
    .select('id, is_qa_demo')
    .eq('id', QA_DEMO_SCHOOL_ID)
    .maybeSingle()

  const existing = existingRaw as { id: string; is_qa_demo?: boolean } | null

  if (!existing) {
    const { error: schoolError } = await db.from('schools').insert({
      id: QA_DEMO_SCHOOL_ID,
      name: QA_DEMO_SCHOOL_NAME,
      structure_name: QA_DEMO_SCHOOL_NAME,
      type: 'lycee',
      city: 'Ouagadougou',
      address: 'Environnement de test — données fictives',
      email: 'demo@edunation.local',
      country: 'Burkina Faso',
      currency: 'XOF',
      evaluation_system: 'sur_20',
      main_language: 'fr',
      access_level: 'prive',
      academic_format: 'trimestre',
      is_active: true,
      is_qa_demo: true,
      platform_status: 'ACTIVE',
    })

    if (schoolError) return { error: schoolError.message }
  } else if (!existing.is_qa_demo) {
    const { error: updateError } = await db
      .from('schools')
      .update({ is_qa_demo: true, is_active: true, platform_status: 'ACTIVE' })
      .eq('id', QA_DEMO_SCHOOL_ID)

    if (updateError) return { error: updateError.message }
  }

  const { count: yearCount, error: yearCountError } = await db
    .from('school_years')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', QA_DEMO_SCHOOL_ID)

  if (yearCountError) return { error: yearCountError.message }

  let created = !existing

  if ((yearCount ?? 0) === 0) {
    const { error: yearError } = await db.from('school_years').insert({
      id: 'eeeeeeee-0000-0000-0000-000000000002',
      school_id: QA_DEMO_SCHOOL_ID,
      name: '2025-2026',
      start_date: '2025-10-01',
      end_date: '2026-07-31',
      is_active: true,
    })
    if (yearError) return { error: yearError.message }
    created = true
  }

  const { count: studentCount, error: studentCountError } = await db
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', QA_DEMO_SCHOOL_ID)

  if (studentCountError) return { error: studentCountError.message }

  if ((studentCount ?? 0) === 0) {
    const seedError = await seedQaDemoStudents(db)
    if (seedError) return { error: seedError }
    created = true
  }

  const { count: finalStudentCount } = await db
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', QA_DEMO_SCHOOL_ID)

  return { ok: true, created, studentCount: finalStudentCount ?? 0 }
}

async function seedQaDemoStudents(db: {
  from: (table: string) => {
    insert: (rows: unknown) => Promise<{ error: { message: string } | null }>
  }
}): Promise<string | null> {
  const levelRows = [
    { id: 'eeeeeeee-0000-0000-0000-000000000003', name: '6ème', order_index: 1, order_num: 1 },
    { id: 'eeeeeeee-0000-0000-0000-000000000004', name: '5ème', order_index: 2, order_num: 2 },
    { id: 'eeeeeeee-0000-0000-0000-000000000005', name: '4ème', order_index: 3, order_num: 3 },
  ]

  for (const level of levelRows) {
    const { error } = await db.from('class_levels').insert({
      id: level.id,
      school_id: QA_DEMO_SCHOOL_ID,
      name: level.name,
      order_index: level.order_index,
      order_num: level.order_num,
    })
    if (error && !/duplicate|unique/i.test(error.message)) return error.message
  }

  const classRows = [
    {
      id: 'eeeeeeee-0000-0000-0000-000000000006',
      class_level_id: 'eeeeeeee-0000-0000-0000-000000000003',
      name: '6ème A',
    },
    {
      id: 'eeeeeeee-0000-0000-0000-000000000007',
      class_level_id: 'eeeeeeee-0000-0000-0000-000000000004',
      name: '5ème A',
    },
  ]

  for (const cls of classRows) {
    const { error } = await db.from('classes').insert({
      id: cls.id,
      school_id: QA_DEMO_SCHOOL_ID,
      school_year_id: 'eeeeeeee-0000-0000-0000-000000000002',
      level_id: cls.class_level_id,
      name: cls.name,
      capacity: 40,
    })
    if (error && !/duplicate|unique/i.test(error.message)) return error.message
  }

  const subjectRows = [
    { id: 'eeeeeeee-0000-0000-0000-000000000008', name: 'Mathématiques', coefficient: 4 },
    { id: 'eeeeeeee-0000-0000-0000-000000000009', name: 'Français', coefficient: 4 },
    { id: 'eeeeeeee-0000-0000-0000-00000000000a', name: 'Histoire-Géographie', coefficient: 2 },
  ]

  for (const subject of subjectRows) {
    const { error } = await db.from('subjects').insert({
      id: subject.id,
      school_id: QA_DEMO_SCHOOL_ID,
      name: subject.name,
      coefficient: subject.coefficient,
      is_active: true,
    })
    if (error && !/duplicate|unique/i.test(error.message)) return error.message
  }

  const studentRows = [
    { id: 'eeeeeeee-0000-0000-0000-00000000000b', iun: 'DEMO-2026-0001', first_name: 'Awa', last_name: 'DEMBELE', gender: 'F', status: 'active', class_id: 'eeeeeeee-0000-0000-0000-000000000006' },
    { id: 'eeeeeeee-0000-0000-0000-00000000000c', iun: 'DEMO-2026-0002', first_name: 'Issa', last_name: 'KONATE', gender: 'M', status: 'active', class_id: 'eeeeeeee-0000-0000-0000-000000000006' },
    { id: 'eeeeeeee-0000-0000-0000-00000000000d', iun: 'DEMO-2026-0003', first_name: 'Mariam', last_name: 'OUEDRAOGO', gender: 'F', status: 'active', class_id: 'eeeeeeee-0000-0000-0000-000000000006' },
    { id: 'eeeeeeee-0000-0000-0000-00000000000e', iun: 'DEMO-2026-0004', first_name: 'Boubacar', last_name: 'SANOU', gender: 'M', status: 'active', class_id: 'eeeeeeee-0000-0000-0000-000000000007' },
    { id: 'eeeeeeee-0000-0000-0000-00000000000f', iun: 'DEMO-2026-0005', first_name: 'Rasmata', last_name: 'ZABRE', gender: 'F', status: 'pending', class_id: null },
  ]

  for (const student of studentRows) {
    const { error } = await db.from('students').insert({
      id: student.id,
      school_id: QA_DEMO_SCHOOL_ID,
      iun: student.iun,
      first_name: student.first_name,
      last_name: student.last_name,
      birth_date: '2013-01-15',
      birth_place: 'Ouagadougou',
      gender: student.gender,
      status: student.status,
    })
    if (error && !/duplicate|unique/i.test(error.message)) return error.message

    if (student.class_id) {
      const { error: enrollError } = await db.from('student_enrollments').insert({
        school_id: QA_DEMO_SCHOOL_ID,
        student_id: student.id,
        class_id: student.class_id,
        school_year_id: 'eeeeeeee-0000-0000-0000-000000000002',
        status: 'active',
      })
      if (enrollError && !/duplicate|unique/i.test(enrollError.message)) return enrollError.message
    }
  }

  return null
}
