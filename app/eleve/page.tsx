import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, UserX, FileText, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mon espace — EduNation',
}

export default async function EleveDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, first_name, school_id, student_enrollments(class_id, school_year_id, school_years(is_active))')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as any
  if (!student) redirect('/login/eleve')

  const activeEnrollment = student.student_enrollments?.find((e: any) => e.school_years?.is_active)
  const classId = activeEnrollment?.class_id
  const schoolYearId = activeEnrollment?.school_year_id

  // Récupérer les dernières notes
  let recentGrades: Array<{ value: number; max_value: number; subjects: { name: string } | null }> = []
  if (classId && schoolYearId) {
    const { data: gradesRaw } = await supabase
      .from('grades')
      .select('value, max_value, subjects(name)')
      .eq('student_id', student.id)
      .eq('school_year_id', schoolYearId)
      .order('created_at', { ascending: false })
      .limit(5)
    recentGrades = (gradesRaw ?? []) as typeof recentGrades
  }

  // Compter les absences
  const { count: absenceCount } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .eq('status', 'absent')

  // Compter les bulletins disponibles
  const { count: bulletinCount } = await supabase
    .from('report_cards')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', student.id)

  const moyennes = recentGrades.length > 0
    ? (recentGrades.reduce((acc, g) => acc + (g.max_value > 0 ? (g.value / g.max_value) * 20 : 0), 0) / recentGrades.length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Bonjour, {student.first_name} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Voici un résumé de votre scolarité</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <BookOpen className="mb-1 h-6 w-6 text-[#1B3A6B]" />
            <p className="text-2xl font-bold text-[#1B3A6B]">{moyennes ?? '—'}</p>
            <p className="text-[11px] text-muted-foreground">Moyenne récente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <UserX className="mb-1 h-6 w-6 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{absenceCount ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Absences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <FileText className="mb-1 h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{bulletinCount ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Bulletins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Calendar className="mb-1 h-6 w-6 text-purple-600" />
            <p className="text-2xl font-bold text-purple-600">{recentGrades.length}</p>
            <p className="text-[11px] text-muted-foreground">Notes récentes</p>
          </CardContent>
        </Card>
      </div>

      {recentGrades.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dernières notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGrades.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{g.subjects?.name ?? 'Matière inconnue'}</span>
                <span className="font-semibold text-[#1B3A6B]">
                  {g.value} / {g.max_value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
