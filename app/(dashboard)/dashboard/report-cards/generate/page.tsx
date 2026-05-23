import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { GenerateReportCardsClient } from '@/features/report-cards/generate-report-cards-client'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Générer les bulletins' }

export default async function GenerateReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const params = await searchParams

  const [classesResult, termsResult, yearsResult, enrollmentsResult] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', ctx.school_id).order('name'),
    supabase.from('terms').select('id, name').eq('school_id', ctx.school_id).order('start_date'),
    supabase.from('school_years').select('id, name').eq('school_id', ctx.school_id).eq('is_active', true).limit(1),
    supabase.from('student_enrollments').select('class_id').eq('school_id', ctx.school_id),
  ])

  const classesRaw = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const terms = (termsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const schoolYear = (yearsResult.data as Array<{ id: string; name: string }> | null)?.[0]
  const enrollments = (enrollmentsResult.data as Array<{ class_id: string }> | null) ?? []

  const countByClass = enrollments.reduce((acc, e) => {
    acc[e.class_id] = (acc[e.class_id] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const classes = classesRaw.map(c => ({
    ...c,
    studentCount: countByClass[c.id] ?? 0,
  }))

  if (!schoolYear) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-medium">Aucune année scolaire active</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Générer les bulletins"
        description={`Préparez les bulletins pour ${schoolYear.name}`}
      />

      {classes.length === 0 || terms.length === 0 ? (
        <EmptyPanel
          title="Configuration incomplète"
          description={
            classes.length === 0
              ? 'Créez des classes et inscrivez des élèves avant de générer les bulletins.'
              : 'Aucune période (trimestre) configurée pour cette année scolaire.'
          }
        />
      ) : (
        <GenerateReportCardsClient
          schoolId={ctx.school_id}
          schoolYearId={schoolYear.id}
          userId={user.id}
          classes={classes}
          terms={terms}
          initialClassId={params.class ?? ''}
        />
      )}
    </div>
  )
}
