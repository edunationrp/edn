import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { AttendanceRecordsTable } from '@/features/attendance/attendance-records-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { assertProviseurNotInPedagogy } from '@/lib/dashboard/proviseur-pedagogy-guard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Historique des présences' }

type Record = {
  id: string
  status: string
  recorded_at: string
  students?: { first_name: string; last_name: string } | null
  classes?: { name: string } | null
}

export default async function AttendanceHistoryPage() {
  await assertProviseurNotInPedagogy()

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

  const records = ((recordsRaw as Record[] | null) ?? []).map(r => ({
    id: r.id,
    status: r.status,
    recorded_at: r.recorded_at,
    studentName: r.students
      ? `${r.students.last_name} ${r.students.first_name}`
      : 'Élève',
    className: r.classes?.name ?? 'Classe',
  }))

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

      <AttendanceRecordsTable records={records} title="Tous les enregistrements" />
    </div>
  )
}
