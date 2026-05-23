import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { calculateRanks, getMention } from '@/lib/grades'
import { TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Classements' }

export default async function GradesRankingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('student_id, value, max_value, students(first_name, last_name)')
    .eq('school_id', ctx.school_id)
    .limit(500)

  type GradeRow = {
    student_id: string
    value: number
    max_value: number
    students?: { first_name: string; last_name: string } | null
  }

  const grades = (gradesRaw as GradeRow[] | null) ?? []

  const byStudent = new Map<string, { name: string; total: number; count: number }>()
  for (const g of grades) {
    const normalized = g.max_value > 0 ? (g.value / g.max_value) * 20 : g.value
    const name = g.students
      ? `${g.students.last_name} ${g.students.first_name}`
      : 'Élève'
    const prev = byStudent.get(g.student_id) ?? { name, total: 0, count: 0 }
    byStudent.set(g.student_id, {
      name,
      total: prev.total + normalized,
      count: prev.count + 1,
    })
  }

  const averages = Array.from(byStudent.entries()).map(([studentId, data]) => ({
    studentId,
    name: data.name,
    average: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
  }))

  const ranked = calculateRanks(averages.map(a => ({ studentId: a.studentId, average: a.average })))
    .map(r => ({
      ...r,
      name: averages.find(a => a.studentId === r.studentId)?.name ?? 'Élève',
      mention: getMention(r.average),
    }))

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Classements"
        description="Moyennes générales calculées à partir des notes saisies"
      />

      {ranked.length === 0 ? (
        <EmptyPanel
          title="Aucune note disponible"
          description="Les classements apparaîtront dès que des notes seront enregistrées."
        />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top {ranked.length} élève(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0 sm:p-6 sm:pt-0">
            {ranked.map(row => (
              <div key={row.studentId} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {row.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.mention}</p>
                  </div>
                </div>
                <Badge variant="secondary">{row.average.toFixed(2)}/20</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
