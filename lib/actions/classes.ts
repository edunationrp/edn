'use server'

import { revalidatePath } from 'next/cache'
import { requireClassesManage, requireSubjectsManage } from '@/lib/classes/access'

export async function createClassLevel(schoolId: string, name: string, orderNum: number) {
  const access = await requireClassesManage()
  if ('error' in access) return { error: access.error }
  if (access.schoolId !== schoolId) return { error: 'Établissement invalide.' }

  const { supabase } = access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('class_levels').insert({
    school_id: schoolId,
    name,
    order_num: orderNum,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function createClass(
  schoolId: string,
  data: { name: string; levelId: string; schoolYearId: string; capacity?: number }
) {
  const access = await requireClassesManage()
  if ('error' in access) return { error: access.error }
  if (access.schoolId !== schoolId) return { error: 'Établissement invalide.' }

  const { supabase } = access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('classes').insert({
    school_id: schoolId,
    school_year_id: data.schoolYearId,
    level_id: data.levelId,
    name: data.name,
    capacity: data.capacity ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function createSubject(
  schoolId: string,
  data: { name: string; coefficient: number }
) {
  const access = await requireSubjectsManage()
  if ('error' in access) return { error: access.error }
  if (access.schoolId !== schoolId) return { error: 'Établissement invalide.' }

  const { supabase } = access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('subjects').insert({
    school_id: schoolId,
    name: data.name,
    coefficient: data.coefficient,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function updateClass(
  classId: string,
  schoolId: string,
  data: { name: string; levelId: string; schoolYearId: string; capacity?: number }
) {
  const access = await requireClassesManage()
  if ('error' in access) return { error: access.error }
  if (access.schoolId !== schoolId) return { error: 'Établissement invalide.' }

  const { supabase } = access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('classes')
    .update({
      name: data.name,
      level_id: data.levelId,
      school_year_id: data.schoolYearId,
      capacity: data.capacity ?? null,
    })
    .eq('id', classId)
    .eq('school_id', schoolId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${classId}`)
  return { success: true }
}

export async function updateSubject(
  subjectId: string,
  schoolId: string,
  data: { name: string; coefficient: number; isActive: boolean }
) {
  const access = await requireSubjectsManage()
  if ('error' in access) return { error: access.error }
  if (access.schoolId !== schoolId) return { error: 'Établissement invalide.' }

  const { supabase } = access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('subjects')
    .update({
      name: data.name,
      coefficient: data.coefficient,
      is_active: data.isActive,
    })
    .eq('id', subjectId)
    .eq('school_id', schoolId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/classes')
  return { success: true }
}
