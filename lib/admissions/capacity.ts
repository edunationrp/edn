import { createClient } from '@/lib/supabase/server'

export async function checkClassCapacity(schoolId: string, classId: string) {
  const supabase = await createClient()

  const { data: classRaw } = await supabase
    .from('classes')
    .select('id, name, capacity, school_year_id')
    .eq('id', classId)
    .eq('school_id', schoolId)
    .limit(1)

  const cls = (
    classRaw as Array<{
      id: string
      name: string
      capacity: number | null
      school_year_id: string
    }> | null
  )?.[0]

  if (!cls) {
    return { ok: false as const, message: 'Classe introuvable.' }
  }

  if (!cls.capacity || cls.capacity <= 0) {
    return { ok: true as const, className: cls.name, enrolled: 0, capacity: null }
  }

  const { count } = await supabase
    .from('student_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('school_year_id', cls.school_year_id)
    .eq('status', 'active')

  const enrolled = count ?? 0

  const { data: pendingRequestsRaw } = await supabase
    .from('student_registration_requests')
    .select('metadata')
    .eq('school_id', schoolId)
    .eq('status', 'pending')

  const pendingForClass = ((pendingRequestsRaw ?? []) as Array<{ metadata: Record<string, unknown> | null }>)
    .filter(row => row.metadata?.class_id === classId).length

  const projected = enrolled + pendingForClass

  if (projected >= cls.capacity) {
    return {
      ok: false as const,
      message: `La classe ${cls.name} est pleine ou saturée (${enrolled}/${cls.capacity} inscrits, ${pendingForClass} demande(s) en cours).`,
      className: cls.name,
      enrolled,
      capacity: cls.capacity,
    }
  }

  if (enrolled >= cls.capacity) {
    return {
      ok: false as const,
      message: `La classe ${cls.name} est pleine (${enrolled}/${cls.capacity} élèves).`,
      className: cls.name,
      enrolled,
      capacity: cls.capacity,
    }
  }

  return {
    ok: true as const,
    className: cls.name,
    enrolled,
    capacity: cls.capacity,
  }
}
