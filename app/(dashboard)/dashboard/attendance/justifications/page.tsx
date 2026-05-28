import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { PendingJustificationsPanel, type PendingJustificationRow } from '@/features/attendance/pending-justifications-panel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Justifications d\'absence' }
export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = [
  'PROVISEUR',
  'CENSEUR',
  'SECRETAIRE',
  'VIE_SCOLAIRE',
  'SURVEILLANT_GENERAL',
  'CONSEILLER',
  'DIRECTEUR_ADJOINT',
  'FONDATEUR',
]

export default async function AttendanceJustificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id || !ALLOWED_ROLES.includes(ctx.role_code)) {
    redirect('/dashboard/attendance')
  }

  const { data: rowsRaw } = await (supabase as any)
    .from('attendance_justifications')
    .select(`
      id,
      reason,
      status,
      created_at,
      profiles:parent_user_id(full_name),
      attendance_records(
        recorded_at,
        subjects(name),
        students(first_name, last_name)
      )
    `)
    .eq('school_id', ctx.school_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const justifications: PendingJustificationRow[] = ((rowsRaw ?? []) as Array<{
    id: string
    reason: string
    status: string
    created_at: string | null
    profiles: { full_name: string | null } | null
    attendance_records: {
      recorded_at: string
      subjects: { name: string } | null
      students: { first_name: string; last_name: string } | null
    } | null
  }>).map(row => ({
    id: row.id,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    parentName: row.profiles?.full_name ?? null,
    recordedAt: row.attendance_records?.recorded_at ?? '',
    subjectName: row.attendance_records?.subjects?.name ?? null,
    studentName: row.attendance_records?.students
      ? `${row.attendance_records.students.first_name} ${row.attendance_records.students.last_name}`
      : 'Élève',
  }))

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Justifications d'absence"
        description={`${justifications.length} demande(s) en attente pour votre établissement.`}
      />
      <PendingJustificationsPanel justifications={justifications} />
    </div>
  )
}
