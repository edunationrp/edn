import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/cards/kpi-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { UserCheck, UserX, Clock, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import { AttendanceRecordsTable } from '@/features/attendance/attendance-records-table'
import { isSchoolFullAuthority } from '@/types/permissions'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id

  const [recentResult, classesResult] = await Promise.all([
    schoolId
      ? supabase
          .from('attendance_records')
          .select('id, student_id, status, recorded_at, students(first_name, last_name)')
          .eq('school_id', schoolId)
          .order('recorded_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')
      : Promise.resolve({ data: null }),
  ])

  const records = (recentResult.data as Array<{
    id: string
    student_id: string
    status: string
    recorded_at: string
    students?: { first_name: string; last_name: string } | null
  }> | null) ?? []
  const classes = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []

  const absentCount = records.filter(r => r.status === 'absent').length
  const lateCount = records.filter(r => r.status === 'late').length
  const presentCount = records.filter(r => r.status === 'present').length
  const totalRecords = records.length

  const isTeacher = ctx?.role_code === 'PROFESSEUR'
  const isSurveillant = ctx?.role_code === 'SURVEILLANT_GENERAL'
  const isAdmin = isSchoolFullAuthority(ctx?.role_code ?? '') ||
    ['DIRECTEUR_ADJOINT', 'CENSEUR'].includes(ctx?.role_code ?? '')
  const canTakeAttendance = isTeacher || isSurveillant || isAdmin

  const recentRows = records.slice(0, 20).map(r => ({
    id: r.id,
    status: r.status,
    recorded_at: r.recorded_at,
    studentName: r.students
      ? `${r.students.last_name} ${r.students.first_name}`
      : 'Élève inconnu',
    className: '—',
  }))

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Absences & Présences"
        description="Suivi des présences, absences et retards"
        actions={
          canTakeAttendance ? (
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/attendance/take">
                <Plus className="h-4 w-4 mr-1" />
                Faire l&apos;appel
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KPICard title="Absences" value={absentCount} icon={<UserX className="h-5 w-5" />} color="red" changeLabel="Enregistrements récents" />
        <KPICard title="Retards" value={lateCount} icon={<Clock className="h-5 w-5" />} color="orange" changeLabel="Enregistrements récents" />
        <KPICard title="Présents" value={presentCount} icon={<UserCheck className="h-5 w-5" />} color="green" changeLabel="Enregistrements récents" />
        <KPICard title="Total" value={totalRecords} icon={<AlertTriangle className="h-5 w-5" />} color="blue" changeLabel="50 derniers" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
        {canTakeAttendance && (
          <div className="xl:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Faire l&apos;appel par classe</CardTitle>
              </CardHeader>
              <CardContent>
                {classes.length > 0 ? (
                  <div className="space-y-2">
                    {classes.map(cls => (
                      <Link
                        key={cls.id}
                        href={`/dashboard/attendance/take?class=${cls.id}`}
                        className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                            {cls.name[0]}
                          </div>
                          <span className="text-sm font-medium group-hover:text-primary">{cls.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Appel →</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">Aucune classe disponible</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className={canTakeAttendance ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <AttendanceRecordsTable
            records={recentRows}
            title="Enregistrements récents"
            compact
          />
        </div>
      </div>
    </div>
  )
}
