import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/cards/kpi-card'
import { UserCheck, UserX, Clock, AlertTriangle, Plus, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

type AttendanceRecord = {
  id: string
  student_id: string
  status: string
  recorded_at: string
  is_justified: boolean
  notes: string | null
}

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [recentResult, todayResult, classesResult] = await Promise.all([
    schoolId
      ? supabase.from('attendance_records').select('id, student_id, status, recorded_at, is_justified, notes').eq('school_id', schoolId).order('recorded_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).gte('recorded_at', today)
      : Promise.resolve({ data: null, count: null }),
    schoolId
      ? supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')
      : Promise.resolve({ data: null }),
  ])

  const records = (recentResult.data as AttendanceRecord[] | null) ?? []
  const classes = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []

  const absentCount = records.filter(r => r.status === 'absent' && !r.is_justified).length
  const lateCount = records.filter(r => r.status === 'late').length
  const justifiedCount = records.filter(r => r.is_justified).length
  const totalRecords = records.length

  const isTeacher = ctx?.role_code === 'PROFESSEUR'
  const isSurveillant = ctx?.role_code === 'SURVEILLANT_GENERAL'
  const isAdmin = ['PROVISEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'].includes(ctx?.role_code ?? '')
  const canTakeAttendance = isTeacher || isSurveillant || isAdmin

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absences & Présences</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Suivi des présences, absences et retards
          </p>
        </div>
        {canTakeAttendance && (
          <Button size="sm" asChild>
            <Link href="/dashboard/attendance/take">
              <Plus className="h-4 w-4 mr-1" />
              Faire l&apos;appel
            </Link>
          </Button>
        )}
      </div>

      {/* Notification PWA/Offline */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <WifiOff className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-blue-800 text-sm">Mode hors ligne disponible</p>
            <p className="text-xs text-blue-700">
              Vous pouvez faire l&apos;appel sans connexion Internet. Les données seront synchronisées automatiquement dès le retour de la connexion.
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0" asChild>
            <Link href="/dashboard/attendance/take">Faire l&apos;appel</Link>
          </Button>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Absences injustifiées"
          value={absentCount}
          icon={<UserX className="h-5 w-5" />}
          color="red"
          changeLabel="7 derniers jours"
        />
        <KPICard
          title="Retards"
          value={lateCount}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
          changeLabel="7 derniers jours"
        />
        <KPICard
          title="Absences justifiées"
          value={justifiedCount}
          icon={<UserCheck className="h-5 w-5" />}
          color="green"
          changeLabel="7 derniers jours"
        />
        <KPICard
          title="Total enregistrements"
          value={totalRecords}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="blue"
          changeLabel="7 derniers jours"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Classes pour faire l'appel */}
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
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {cls.name[0]}
                          </div>
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">{cls.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Appel →</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune classe disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Historique des enregistrements */}
        <div className={canTakeAttendance ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-500" />
                  Absences récentes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/attendance/history">Historique complet</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Élève ID</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">Statut</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">Justifié</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.slice(0, 20).map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-mono text-xs">{r.student_id.slice(0, 8)}…</td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge className={`text-xs ${
                              r.status === 'absent' ? 'bg-red-100 text-red-800' :
                              r.status === 'late' ? 'bg-orange-100 text-orange-800' :
                              r.status === 'present' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {r.status === 'absent' ? 'Absent' :
                               r.status === 'late' ? 'Retard' :
                               r.status === 'present' ? 'Présent' : r.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {r.is_justified ? (
                              <UserCheck className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs">{formatDate(r.recorded_at)}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.notes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune absence enregistrée récemment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
