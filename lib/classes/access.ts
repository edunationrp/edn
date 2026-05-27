import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { Permission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  schoolId: string
  role: UserRole
}

type AccessError = { error: string }
type AccessResult = AccessContext | AccessError

async function requireSchoolAccess(minPermission?: Permission): Promise<AccessResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (minPermission && !hasPermission(role, minPermission)) {
    return { error: 'Vous n\'avez pas les droits pour cette action.' }
  }

  return {
    supabase,
    userId: user.id,
    schoolId: ctx.school_id,
    role,
  }
}

export function canManageClasses(role: UserRole | string) {
  return hasPermission(role, 'classes:manage')
}

export function canManageSubjects(role: UserRole | string) {
  return hasPermission(role, 'subjects:manage')
}

export async function requireClassesManage() {
  return requireSchoolAccess('classes:manage')
}

export async function requireSubjectsManage() {
  return requireSchoolAccess('subjects:manage')
}

export type TeacherAssignmentRow = {
  id: string
  classId: string | null
  subjectId: string | null
  className: string
  subjectName: string
}

export async function getTeacherAssignments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  schoolId: string,
): Promise<TeacherAssignmentRow[]> {
  const { data } = await supabase
    .from('teacher_assignments')
    .select('id, class_id, subject_id, classes(name), subjects(name)')
    .eq('teacher_id', userId)
    .eq('school_id', schoolId)
    .eq('is_active', true)

  return ((data ?? []) as Array<{
    id: string
    class_id: string | null
    subject_id: string | null
    classes: { name: string } | null
    subjects: { name: string } | null
  }>).map(row => ({
    id: row.id,
    classId: row.class_id,
    subjectId: row.subject_id,
    className: row.classes?.name ?? 'Classe',
    subjectName: row.subjects?.name ?? 'Matière',
  }))
}

export async function teacherCanAccessClass(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  schoolId: string,
  classId: string,
  role: UserRole,
) {
  if (canManageClasses(role)) return true

  const { data } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', userId)
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .limit(1)

  return (data?.length ?? 0) > 0
}
