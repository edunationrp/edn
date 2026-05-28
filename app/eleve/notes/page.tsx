import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes notes — EduNation' }

export default async function EleveNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, student_enrollments(class_id, school_year_id, school_years(is_active, name))')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as any
  if (!student) redirect('/login/eleve')

  const activeEnrollment = student.student_enrollments?.find((e: any) => e.school_years?.is_active)
  const schoolYearId = activeEnrollment?.school_year_id

  const { data: gradesRaw } = schoolYearId
    ? await supabase
        .from('grades')
        .select('id, value, max_value, period, term, subjects(name)')
        .eq('student_id', student.id)
        .eq('school_year_id', schoolYearId)
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

  // Grouper par période
  const byPeriod: Record<string, typeof grades> = {}
  for (const g of grades) {
    const key = g.period ?? g.term ?? 'Général'
    if (!byPeriod[key]) byPeriod[key] = []
    byPeriod[key].push(g)
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes notes</h1>
      {Object.keys(byPeriod).length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune note disponible pour le moment.</p>
      ) : (
        Object.entries(byPeriod).map(([period, pGrades]) => {
          const moyenne = pGrades.length > 0
            ? (pGrades.reduce((acc, g) => acc + (g.max_value > 0 ? (g.value / g.max_value) * 20 : 0), 0) / pGrades.length).toFixed(1)
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
                {pGrades.map(g => (
                  <div key={g.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-gray-700">{g.subjects?.name ?? '—'}</span>
                    <span className="font-semibold text-[#1B3A6B]">
                      {g.value} <span className="font-normal text-muted-foreground">/ {g.max_value}</span>
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
