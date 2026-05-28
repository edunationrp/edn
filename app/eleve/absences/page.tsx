import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes absences — EduNation' }

export default async function EleveAbsencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as { id: string } | null
  if (!student) redirect('/login/eleve')

  const { data: recordsRaw } = await supabase
    .from('attendance_records')
    .select('id, status, recorded_at, subjects(name)')
    .eq('student_id', student.id)
    .in('status', ['absent', 'late'])
    .order('recorded_at', { ascending: false })

  const records = (recordsRaw ?? []) as Array<{
    id: string
    status: string
    recorded_at: string
    subjects: { name: string } | null
  }>

  const absences = records.filter(r => r.status === 'absent').length
  const lates = records.filter(r => r.status === 'late').length

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes absences & retards</h1>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-2xl font-bold text-red-500">{absences}</span>
            <span className="text-sm text-muted-foreground">Absences</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-2xl font-bold text-orange-500">{lates}</span>
            <span className="text-sm text-muted-foreground">Retards</span>
          </CardContent>
        </Card>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune absence enregistrée.</p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="flex min-w-0 items-start justify-between gap-2 text-sm sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-700">{r.subjects?.name ?? 'Cours'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.recorded_at)}</p>
                </div>
                <Badge variant={r.status === 'absent' ? 'destructive' : 'secondary'}>
                  {r.status === 'absent' ? 'Absent' : 'Retard'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
