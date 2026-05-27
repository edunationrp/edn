import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Emploi du temps — EduNation' }

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default async function EleveEmploiDuTempsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, school_id, student_enrollments(class_id, school_years(is_active))')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as any
  if (!student) redirect('/login/eleve')

  const activeEnrollment = student.student_enrollments?.find((e: any) => e.school_years?.is_active)
  const classId = activeEnrollment?.class_id

  let schedule: any[] = []
  if (classId) {
    const { data } = await supabase
      .from('teacher_assignments')
      .select('id, day_of_week, start_time, end_time, subjects(name), profiles(full_name)')
      .eq('class_id', classId)
      .order('start_time')
    schedule = (data ?? []) as any[]
  }

  const byDay: Record<string, typeof schedule> = {}
  for (const slot of schedule) {
    const key = slot.day_of_week ?? 'unknown'
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(slot)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Emploi du temps</h1>

      {schedule.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          L'emploi du temps n'a pas encore été configuré pour votre classe.
        </p>
      ) : (
        <div className="space-y-3">
          {DAY_KEYS.map((dayKey, idx) => {
            const slots = byDay[dayKey] ?? []
            if (slots.length === 0) return null
            return (
              <Card key={dayKey}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{DAYS[idx]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {slots.map((slot: any) => (
                    <div key={slot.id} className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">
                        {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-700">
                          {slot.subjects?.name ?? '—'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {slot.profiles?.full_name ?? ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
