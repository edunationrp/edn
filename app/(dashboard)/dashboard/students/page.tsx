import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { StudentsTable } from '@/features/students/students-table'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestion des élèves',
}

const PAGE_SIZE = 20

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const schoolRole = await getUserSchoolContext(user.id)
  const schoolId = schoolRole?.school_id
  if (!schoolId) redirect('/dashboard')

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: studentsRaw, count } = await supabase
    .from('students')
    .select(
      'id, iun, first_name, last_name, birth_date, gender, phone, status, photo_url, created_at, student_enrollments(class_id, classes(name))',
      { count: 'exact' }
    )
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true })
    .range(from, to)

  const students =
    (studentsRaw as Array<{
      id: string
      iun: string
      first_name: string
      last_name: string
      birth_date: string
      gender: 'M' | 'F'
      phone: string | null
      status: string
      photo_url: string | null
      created_at: string
      student_enrollments: Array<{ class_id: string; classes: { name: string } | null }>
    }> | null) ?? []

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <DashboardPage>
      <PageHeader
        title="Élèves"
        description={`${total} élève${total > 1 ? 's' : ''} au total`}
        actions={
          <Button asChild className="w-full sm:w-auto" variant="brandDark">
            <Link href="/dashboard/students/new">
              <UserPlus className="h-4 w-4" />
              Inscrire un élève
            </Link>
          </Button>
        }
      />

      {total === 0 ? (
        <EmptyPanel
          title="Aucun élève inscrit"
          description="Commencez par inscrire votre premier élève pour gérer les dossiers scolaires."
          action={
            <Button asChild size="sm" variant="brandDark">
              <Link href="/dashboard/students/new">Inscrire un élève</Link>
            </Button>
          }
        />
      ) : (
        <StudentsTable
          students={students as never}
          page={page}
          totalPages={totalPages}
          totalCount={total}
        />
      )}
    </DashboardPage>
  )
}
