import { createClient } from '@/lib/supabase/server'
import { isSchoolFullAuthority } from '@/types/permissions'

export const FINANCE_STAFF_ROLES = [
  'PROVISEUR',
  'DIRECTEUR_ADJOINT',
  'INTENDANT',
  'SECRETAIRE',
  'SUPER_ADMIN_EDUNATION',
  'CENSEUR',
  'FONDATEUR',
] as const

export const AUDIT_LOG_ROLES = [
  'PROVISEUR',
  'DIRECTEUR_ADJOINT',
  'SUPER_ADMIN_EDUNATION',
  'CENSEUR',
] as const

/** null = accès à tous les élèves de l'établissement (personnel). */
export async function getScopedStudentIds(
  userId: string,
  roleCode: string
): Promise<string[] | null> {
  const supabase = await createClient()

  if (roleCode === 'PARENT' || roleCode === 'PARENT_ILLETRE') {
    const { data } = await supabase
      .from('parent_student_relations')
      .select('student_id')
      .eq('parent_user_id', userId)

    return ((data ?? []) as Array<{ student_id: string }>).map(row => row.student_id)
  }

  if (roleCode === 'ELEVE') {
    const { data: studentRaw } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    const student = (studentRaw as Array<{ id: string }> | null)?.[0]
    return student ? [student.id] : []
  }

  return null
}

export function canAccessFinance(roleCode: string) {
  return FINANCE_STAFF_ROLES.includes(roleCode as (typeof FINANCE_STAFF_ROLES)[number])
}

export function canAccessAuditLogs(roleCode: string) {
  return isSchoolFullAuthority(roleCode) ||
    AUDIT_LOG_ROLES.includes(roleCode as (typeof AUDIT_LOG_ROLES)[number])
}

/** Proviseur / fondateur : pas de gestion opérationnelle notes, bulletins ni absences. */
export function isProviseurPedagogyExcluded(roleCode: string) {
  return isSchoolFullAuthority(roleCode)
}
