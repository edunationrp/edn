import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { getTeacherAssignments } from '@/lib/classes/access'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { GradeSheetEntryClient } from '@/features/grades/grade-sheet-entry-client'
import { GradeValidationPanel } from '@/features/grades/grade-validation-panel'
import { GradePublicationPanel } from '@/features/grades/grade-publication-panel'
import { getPendingGradeSubmissionsForTeacher } from '@/lib/actions/grade-sheet-validation'
import { getPendingGradePublicationsForSecretary } from '@/lib/actions/grade-publication'

export default async function GradeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'grades:create') && !hasPermission(role, 'grades:update')) {
    redirect('/dashboard/grades')
  }

  const isTeacher = role === 'PROFESSEUR'
  const isSecretary = role === 'SECRETAIRE'

  const [classesResult, subjectsResult, assignmentsResult] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', ctx.school_id).order('name'),
    supabase
      .from('subjects')
      .select('id, name, coefficient')
      .eq('school_id', ctx.school_id)
      .eq('is_active', true)
      .order('name'),
    isTeacher ? getTeacherAssignments(supabase, user.id, ctx.school_id) : Promise.resolve([]),
  ])

  const classesRaw = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const subjectsRaw =
    (subjectsResult.data as Array<{ id: string; name: string; coefficient: number }> | null) ?? []

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

  const params = await searchParams
  const pendingSubmissions = isTeacher ? await getPendingGradeSubmissionsForTeacher() : []
  const pendingPublications = isSecretary ? await getPendingGradePublicationsForSecretary() : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saisie des notes – Ma classe</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Devoirs, examen optionnel, moyenne automatique et alertes en un coup d&apos;œil.
        </p>
      </div>

      {isTeacher && (
        <GradeValidationPanel
          submissions={pendingSubmissions}
          initialSubmissionId={params.submission}
        />
      )}

      {isSecretary && <GradePublicationPanel publications={pendingPublications} />}

      <GradeSheetEntryClient
        schoolId={ctx.school_id}
        userRole={role}
        classes={classes}
        subjects={subjects}
      />
    </div>
  )
}
