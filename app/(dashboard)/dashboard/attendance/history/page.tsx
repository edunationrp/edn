import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { UserX, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Historique des présences' }

type Record = {
  id: string
  status: string
  recorded_at: string
  students?: { first_name: string; last_name: string } | null
  classes?: { name: string } | null
}

function statusLabel(status: string) {
  if (status === 'absent') return 'Absent'
  if (status === 'late') return 'Retard'
  if (status === 'present') return 'Présent'
  return status
}

export default async function AttendanceHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: recordsRaw } = await supabase
    .from('attendance_records')
    .select('id, status, recorded_at, students(first_name, last_name), classes(name)')
    .eq('school_id', ctx.school_id)
    .order('recorded_at', { ascending: false })
    .limit(200)

  const records = (recordsRaw as Record[] | null) ?? []

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Historique complet"
        description={`${records.length} enregistrement(s)`}
        actions={
          <Button size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/attendance/take">
              <Plus className="h-4 w-4 mr-1" />
              Faire l&apos;appel
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="h-4 w-4 text-red-500" />
            Tous les enregistrements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {records.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucun enregistrement</p>
          ) : (
            <div className="divide-y">
              {records.map(r => {
                const name = r.students
                  ? `${r.students.last_name} ${r.students.first_name}`
                  : 'Élève'
                return (
                  <div key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-0">
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.classes?.name ?? 'Classe'} · {formatDate(r.recorded_at)}
                      </p>
                    </div>
                    <Badge variant="secondary">{statusLabel(r.status)}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
