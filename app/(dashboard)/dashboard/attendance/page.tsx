import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/cards/kpi-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { UserCheck, UserX, Clock, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { isSchoolFullAuthority } from '@/types/permissions'

type AttendanceRecord = {
  id: string
  student_id: string
  status: string
  recorded_at: string
  students?: { first_name: string; last_name: string } | null
}

function statusLabel(status: string) {
  if (status === 'absent') return 'Absent'
  if (status === 'late') return 'Retard'
  if (status === 'present') return 'Présent'
  if (status === 'sick') return 'Malade'
  if (status === 'excused') return 'Excusé'
  return status
}

function statusBadgeClass(status: string) {
  if (status === 'absent') return 'bg-red-100 text-red-800'
  if (status === 'late') return 'bg-orange-100 text-orange-800'
  if (status === 'present') return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-800'
}

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

  const records = (recentResult.data as AttendanceRecord[] | null) ?? []
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

  const recentRows = records.slice(0, 20)

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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserX className="h-4 w-4 text-red-500" />
                Enregistrements récents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {recentRows.length > 0 ? (
                <>
                  <div className="divide-y sm:hidden">
                    {recentRows.map(r => {
                      const name = r.students
                        ? `${r.students.last_name} ${r.students.first_name}`
                        : 'Élève inconnu'
                      return (
                        <div key={r.id} className="px-4 py-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{name}</p>
                            <Badge className={`text-xs ${statusBadgeClass(r.status)}`}>
                              {statusLabel(r.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.recorded_at)}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Élève</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Statut</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRows.map(r => {
                          const name = r.students
                            ? `${r.students.last_name} ${r.students.first_name}`
                            : 'Élève inconnu'
                          return (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-2.5 text-sm font-medium">{name}</td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge className={`text-xs ${statusBadgeClass(r.status)}`}>
                                  {statusLabel(r.status)}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(r.recorded_at)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <UserCheck className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Aucun enregistrement récent</p>
                  {canTakeAttendance && (
                    <Button variant="link" size="sm" asChild className="mt-2">
                      <Link href="/dashboard/attendance/take">Faire le premier appel</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
