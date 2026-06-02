import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import {
  teacherCanAccessAssignment,
  getTeacherAssignmentOptions,
} from '@/lib/attendance/teacher-attendance'
import { redirect } from 'next/navigation'
import { AttendanceTakeClient } from '@/features/attendance/attendance-take-client'
import { assertProviseurNotInPedagogy } from '@/lib/dashboard/proviseur-pedagogy-guard'
import type { Metadata } from 'next'
import type { UserRole } from '@/types/roles'

export const metadata: Metadata = {
  title: 'Prise de présence',
}

export default async function AttendanceTakePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; subject?: string }>
}) {
  await assertProviseurNotInPedagogy()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id
  if (!schoolId) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  const isTeacher = role === 'PROFESSEUR'
  const params = await searchParams

  if (isTeacher && params.class && params.subject) {
    const canAccess = await teacherCanAccessAssignment(
      supabase,
      user.id,
      schoolId,
      params.class,
      params.subject,
    )
    if (!canAccess) redirect('/dashboard/attendance/take')
  }

  const [classesResult, subjectsResult, yearResult, assignments] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name'),
    supabase.from('subjects').select('id, name').eq('school_id', schoolId).eq('is_active', true).order('name'),
    supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1),
    isTeacher ? getTeacherAssignmentOptions(supabase, user.id, schoolId) : Promise.resolve([]),
  ])

  const classesRaw = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const subjectsRaw = (subjectsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const assignedClassIds = new Set(assignments.map(a => a.classId))
  const assignedSubjectIds = new Set(assignments.map(a => a.subjectId))
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
      assignments={isTeacher ? assignments : undefined}
      initialClassId={params.class ?? ''}
      initialSubjectId={params.subject ?? ''}
    />
  )
}
