import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PARENT_ACTIVE_CHILD_COOKIE } from '@/lib/parent/cookies'

export type ParentChildSummary = {
  studentId: string
  firstName: string
  lastName: string
  fullName: string
  iun: string
  className: string | null
  schoolYear: string | null
  schoolYearId: string | null
  classId: string | null
  schoolId: string
  schoolName: string
  schoolLogoUrl: string | null
  schoolWatermarkOpacity: number | null
  relationType: string
}

type RelationRow = {
  relation_type: string
  school_id: string
  schools: {
    name: string
    logo_url: string | null
    logo_watermark_opacity: number | null
  } | null
  students: {
    id: string
    first_name: string
    last_name: string
    iun: string
    student_enrollments: Array<{
      class_id: string
      school_year_id: string
      status: string
      classes: { name: string } | null
      school_years: { name: string; is_active: boolean } | null
    }> | null
  } | null
}

function mapRelationToChild(row: RelationRow): ParentChildSummary | null {
  const student = row.students
  if (!student) return null

  const activeEnrollment = (student.student_enrollments ?? []).find(
    e => e.school_years?.is_active && e.status === 'active',
  ) ?? (student.student_enrollments ?? [])[0]

  return {
    studentId: student.id,
    firstName: student.first_name,
    lastName: student.last_name,
    fullName: `${student.first_name} ${student.last_name}`.trim(),
    iun: student.iun,
    className: activeEnrollment?.classes?.name ?? null,
    schoolYear: activeEnrollment?.school_years?.name ?? null,
    schoolYearId: activeEnrollment?.school_year_id ?? null,
    classId: activeEnrollment?.class_id ?? null,
    schoolId: row.school_id,
    schoolName: row.schools?.name ?? 'Établissement',
    schoolLogoUrl: row.schools?.logo_url ?? null,
    schoolWatermarkOpacity: row.schools?.logo_watermark_opacity ?? null,
    relationType: row.relation_type,
  }
}

export async function getParentChildren(userId: string): Promise<ParentChildSummary[]> {
  const supabase = await createClient()

  const { data: relationsRaw } = await supabase
    .from('parent_student_relations')
    .select(`
      relation_type,
      school_id,
      schools(name, logo_url, logo_watermark_opacity),
      students(
        id,
        first_name,
        last_name,
        iun,
        student_enrollments(
          class_id,
          school_year_id,
          status,
          classes(name),
          school_years(name, is_active)
        )
      )
    `)
    .eq('parent_user_id', userId)

  return ((relationsRaw ?? []) as RelationRow[])
    .map(mapRelationToChild)
    .filter((child): child is ParentChildSummary => child !== null)
}

export async function resolveActiveParentChild(userId: string): Promise<{
  children: ParentChildSummary[]
  activeChild: ParentChildSummary | null
}> {
  const children = await getParentChildren(userId)
  if (children.length === 0) {
    return { children, activeChild: null }
  }

  const cookieStore = await cookies()
  const preferredId = cookieStore.get(PARENT_ACTIVE_CHILD_COOKIE)?.value
  const activeChild = children.find(child => child.studentId === preferredId) ?? children[0]

  return { children, activeChild }
}

export async function requireParentPortalAccess(userId: string): Promise<{
  parentName: string
  children: ParentChildSummary[]
  activeChild: ParentChildSummary | null
}> {
  const supabase = await createClient()

  const [{ children, activeChild }, profileResult, accountResult] = await Promise.all([
    resolveActiveParentChild(userId),
    supabase.from('profiles').select('full_name, default_role').eq('id', userId).maybeSingle(),
    supabase.from('parent_accounts').select('first_name, last_name').eq('id', userId).maybeSingle(),
  ])

  const profile = profileResult.data as { full_name: string | null; default_role: string | null } | null
  const account = accountResult.data as { first_name: string; last_name: string } | null

  const role = profile?.default_role
  const isParentRole = role === 'PARENT' || role === 'PARENT_ILLETRE'
  if (!account && !isParentRole) {
    throw new Error('NOT_PARENT')
  }

  const parentName =
    profile?.full_name?.trim()
    || (account ? `${account.first_name} ${account.last_name}`.trim() : '')
    || 'Parent'

  return { parentName, children, activeChild }
}
