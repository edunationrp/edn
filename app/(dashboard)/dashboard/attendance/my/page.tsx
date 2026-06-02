import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { AttendanceRecordsTable } from '@/features/attendance/attendance-records-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getTeacherAttendanceHistory } from '@/lib/attendance/teacher-attendance'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes appels — Professeur' }

export default async function TeacherAttendanceHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (ctx.role_code !== 'PROFESSEUR') redirect('/dashboard/attendance/history')

  const records = await getTeacherAttendanceHistory(ctx.school_id, user.id)

  const rows = records.map(r => ({
    id: r.id,
    status: r.status,
    recorded_at: r.recorded_at,
    studentName: r.studentName,
    className: `${r.className} · ${r.subjectName}`,
  }))

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Mes appels"
        description={`${records.length} enregistrement(s) — vos classes et matières uniquement`}
        actions={
          <Button size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/attendance/take">
              <Plus className="h-4 w-4 mr-1" />
              Faire l&apos;appel
            </Link>
          </Button>
        }
      />

      <AttendanceRecordsTable records={rows} title="Historique de mes appels" />
    </div>
  )
}
