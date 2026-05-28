import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notes — Espace parent' }

export default async function ParentNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Notes de l'enfant" />
  }

  const { data: gradesRaw } = activeChild.schoolYearId
    ? await supabase
        .from('grades')
        .select('id, value, max_value, period, term, subjects(name)')
        .eq('student_id', activeChild.studentId)
        .eq('school_year_id', activeChild.schoolYearId)
        .order('created_at', { ascending: false })
    : { data: [] }

  const grades = (gradesRaw ?? []) as Array<{
    id: string
    value: number
    max_value: number
    period: string | null
    term: string | null
    subjects: { name: string } | null
  }>

  const byPeriod: Record<string, typeof grades> = {}
  for (const grade of grades) {
    const key = grade.period ?? grade.term ?? 'Général'
    if (!byPeriod[key]) byPeriod[key] = []
    byPeriod[key].push(grade)
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Notes</h1>
        <p className="text-sm text-muted-foreground">
          {activeChild.fullName} · {activeChild.className ?? 'Classe'} · {activeChild.schoolName}
        </p>
      </div>

      {Object.keys(byPeriod).length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune note disponible pour le moment.</p>
      ) : (
        Object.entries(byPeriod).map(([period, periodGrades]) => {
          const moyenne = periodGrades.length > 0
            ? (
              periodGrades.reduce(
                (acc, grade) => acc + (grade.max_value > 0 ? (grade.value / grade.max_value) * 20 : 0),
                0,
              ) / periodGrades.length
            ).toFixed(1)
            : '—'

          return (
            <Card key={period}>
              <CardHeader className="pb-2">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm">{period}</CardTitle>
                  <Badge variant="secondary" className="w-fit">Moy. {moyenne}/20</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {periodGrades.map(grade => (
                  <div
                    key={grade.id}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-gray-700">{grade.subjects?.name ?? '—'}</span>
                    <span className="font-semibold text-[#1B3A6B]">
                      {grade.value} <span className="font-normal text-muted-foreground">/ {grade.max_value}</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
