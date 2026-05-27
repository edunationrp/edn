'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { ROLE_LABELS, STAFF_ROLES, type UserRole } from '@/types/roles'
import { canAccessStudentRegistry } from '@/lib/students/registry-access'

export type DashboardEntityResult = {
  id: string
  type: 'student' | 'staff' | 'class' | 'subject'
  title: string
  subtitle: string
  href: string
}

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

export async function searchDashboardEntities(query: string): Promise<DashboardEntityResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return []

  const pattern = `%${escapeIlike(trimmed)}%`
  const schoolId = ctx.school_id
  const role = ctx.role_code
  const includeStudents = canAccessStudentRegistry(role)

  const [studentsRes, classesRes, subjectsRes, staffRes] = await Promise.all([
    includeStudents
      ? supabase
          .from('students')
          .select('id, first_name, last_name, iun, status')
          .eq('school_id', schoolId)
          .or(`last_name.ilike.${pattern},first_name.ilike.${pattern},iun.ilike.${pattern}`)
          .limit(6)
      : Promise.resolve({ data: [] }),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .ilike('name', pattern)
      .limit(4),
    supabase
      .from('subjects')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .ilike('name', pattern)
      .limit(4),
    supabase
      .from('user_school_roles')
      .select('user_id, role_code')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .in('role_code', STAFF_ROLES),
  ])

  let staffRows: Array<{
    user_id: string
    role_code: string
    profiles: {
      id: string
      full_name: string | null
      first_name: string | null
      last_name: string | null
      email: string | null
    } | null
  }> = []

  const schoolUserIds = ((staffRes.data ?? []) as Array<{ user_id: string; role_code: string }>).map(
    row => row.user_id
  )
  const roleByUserId = new Map(
    ((staffRes.data ?? []) as Array<{ user_id: string; role_code: string }>).map(row => [
      row.user_id,
      row.role_code,
    ])
  )

  if (schoolUserIds.length > 0) {
    const { data: profilesRaw } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, email')
      .in('id', schoolUserIds)
      .or(
        `full_name.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`
      )
      .limit(6)

    staffRows = ((profilesRaw ?? []) as Array<{
      id: string
      full_name: string | null
      first_name: string | null
      last_name: string | null
      email: string | null
    }>).map(profile => ({
      user_id: profile.id,
      role_code: roleByUserId.get(profile.id) ?? 'STAFF',
      profiles: profile,
    }))
  }

  const results: DashboardEntityResult[] = []

  for (const student of (studentsRes.data ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    iun: string | null
    status: string
  }>) {
    results.push({
      id: `student-${student.id}`,
      type: 'student',
      title: `${student.first_name} ${student.last_name}`.trim(),
      subtitle: student.iun ? `IUN ${student.iun}` : 'Élève',
      href: '/dashboard/students',
    })
  }

  for (const cls of (classesRes.data ?? []) as Array<{ id: string; name: string }>) {
    results.push({
      id: `class-${cls.id}`,
      type: 'class',
      title: cls.name,
      subtitle: 'Classe',
      href: '/dashboard/classes',
    })
  }

  for (const subject of (subjectsRes.data ?? []) as Array<{ id: string; name: string }>) {
    results.push({
      id: `subject-${subject.id}`,
      type: 'subject',
      title: subject.name,
      subtitle: 'Matière',
      href: '/dashboard/classes',
    })
  }

  for (const row of staffRows) {
    const profile = row.profiles
    if (!profile) continue
    const name =
      profile.full_name?.trim() ||
      `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() ||
      profile.email ||
      'Membre du personnel'
    const roleLabel = ROLE_LABELS[row.role_code as UserRole] ?? row.role_code.replace(/_/g, ' ')

    results.push({
      id: `staff-${row.user_id}`,
      type: 'staff',
      title: name,
      subtitle: roleLabel,
      href: '/dashboard/staff',
    })
  }

  return results.slice(0, 16)
}
