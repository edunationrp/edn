import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { getTeacherAssignments, teacherCanAccessClass } from '@/lib/classes/access'
import { redirect } from 'next/navigation'
import { AttendanceTakeClient } from '@/features/attendance/attendance-take-client'
import type { Metadata } from 'next'
import type { UserRole } from '@/types/roles'

export const metadata: Metadata = {
  title: 'Prise de présence',
}

export default async function AttendanceTakePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id
  if (!schoolId) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  const isTeacher = role === 'PROFESSEUR'
  const params = await searchParams

  if (isTeacher && params.class) {
    const canAccess = await teacherCanAccessClass(supabase, user.id, schoolId, params.class, role)
    if (!canAccess) redirect('/dashboard/attendance')
  }

  const [classesResult, subjectsResult, yearResult, assignmentsResult] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name'),
    supabase.from('subjects').select('id, name').eq('school_id', schoolId).eq('is_active', true).order('name'),
    supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1),
    isTeacher ? getTeacherAssignments(supabase, user.id, schoolId) : Promise.resolve([]),
  ])

  const classesRaw = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const subjectsRaw = (subjectsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const assignedClassIds = new Set(
    assignmentsResult.map(a => a.classId).filter(Boolean) as string[],
  )
  const assignedSubjectIds = new Set(
    assignmentsResult.map(a => a.subjectId).filter(Boolean) as string[],
  )
  const classes = isTeacher
    ? classesRaw.filter(cls => assignedClassIds.has(cls.id))
    : classesRaw
  const subjects = isTeacher
    ? subjectsRaw.filter(sub => assignedSubjectIds.has(sub.id))
    : subjectsRaw
  const schoolYear = (yearResult.data as Array<{ id: string; name: string }> | null)?.[0]

  if (!schoolYear) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-medium text-gray-900">Aucune année scolaire active</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez une année scolaire avant de faire l&apos;appel.
        </p>
      </div>
    )
  }

  return (
    <AttendanceTakeClient
      schoolId={schoolId}
      teacherId={user.id}
      schoolYearId={schoolYear.id}
      classes={classes}
      subjects={subjects}
      initialClassId={params.class ?? ''}
    />
  )
}
