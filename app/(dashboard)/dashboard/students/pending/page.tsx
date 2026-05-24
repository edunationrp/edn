import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { PendingStudentsTable } from '@/features/students/pending-students-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Élèves en attente',
}

export default async function PendingStudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const schoolRole = await getUserSchoolContext(user.id)

  const { data: studentsRaw, count } = await supabase
    .from('students')
    .select('id, iun, first_name, last_name, birth_date, birth_place, created_at', { count: 'exact' })
    .eq('school_id', schoolRole?.school_id ?? '')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const students = (studentsRaw as Array<{
    id: string; iun: string; first_name: string; last_name: string;
    birth_date: string; birth_place: string | null; created_at: string;
  }> | null) ?? []

  const total = count ?? 0

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Élèves en attente de validation"
        description={`${total} inscription${total > 1 ? 's' : ''} à traiter`}
      />

      {total === 0 ? (
        <PendingStudentsTable students={[]} />
      ) : (
        <PendingStudentsTable students={students} />
      )}
    </div>
  )
}
