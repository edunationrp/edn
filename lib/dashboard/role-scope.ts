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
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', userId)
      .limit(1)

    const profile = (
      profileRaw as Array<{ email: string | null; phone: string | null }> | null
    )?.[0]

    if (!profile) return []

    const filters: string[] = []
    if (profile.email) filters.push(`phone.eq.${profile.email}`)
    if (profile.phone) filters.push(`phone.eq.${profile.phone}`)

    if (filters.length === 0) return []

    const { data: studentsRaw } = await supabase
      .from('students')
      .select('id')
      .or(filters.join(','))
      .limit(5)

    return ((studentsRaw ?? []) as Array<{ id: string }>).map(row => row.id)
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
