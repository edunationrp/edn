import { normalizeRole } from '@/types/roles'
import type { UserRole } from '@/types/roles'

export const NON_REMOVABLE_STAFF_ROLES: UserRole[] = [
  'PROVISEUR',
  'FONDATEUR',
  'SUPER_ADMIN_EDUNATION',
]

export function isRemovableStaffRole(roleCode: string) {
  const role = normalizeRole(roleCode)
  return !NON_REMOVABLE_STAFF_ROLES.includes(role)
}

export function canRemoveStaffMember(params: {
  canRemove: boolean
  roleCode: string
}) {
  return params.canRemove && isRemovableStaffRole(params.roleCode)
}

export async function cleanupTeacherSchoolMembership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  teacherUserId: string
): Promise<{ error?: string }> {
  const { error: assignmentsError } = await db
    .from('teacher_assignments')
    .delete()
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherUserId)

  if (assignmentsError) {
    return { error: assignmentsError.message }
  }

  const { error: classesError } = await db
    .from('classes')
    .update({ main_teacher_id: null })
    .eq('school_id', schoolId)
    .eq('main_teacher_id', teacherUserId)

  if (classesError) {
    return { error: classesError.message }
  }

  return {}
}
