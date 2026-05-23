import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { GradeEntryClient } from '@/features/grades/grade-entry-client'

export default async function GradeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ evaluationId?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const params = await searchParams

  const [classesResult, subjectsResult, yearsResult] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', ctx.school_id).order('name'),
    supabase.from('subjects').select('id, name, coefficient').eq('school_id', ctx.school_id).eq('is_active', true).order('name'),
    supabase.from('school_years').select('id, name').eq('school_id', ctx.school_id).eq('is_active', true).limit(1),
  ])

  const classes = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const subjects = (subjectsResult.data as Array<{ id: string; name: string; coefficient: number }> | null) ?? []
  const years = (yearsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const currentYear = years[0] ?? null

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saisie des notes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Saisissez les notes par classe, matière et trimestre
        </p>
      </div>
      <GradeEntryClient
        schoolId={ctx.school_id}
        teacherId={user.id}
        classes={classes}
        subjects={subjects}
        currentYear={currentYear}
        initialEvaluationId={params.evaluationId}
      />
    </div>
  )
}
