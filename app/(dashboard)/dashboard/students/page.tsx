import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { StudentsTable } from '@/features/students/students-table'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liste des élèves — EduNation',
}

const PAGE_SIZE = 20

type StudentsSearchParams = {
  page?: string
  q?: string
  class?: string
  gender?: string
  status?: string
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<StudentsSearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const searchQuery = params.q?.trim() ?? ''
  const classFilter = params.class?.trim() ?? 'all'
  const genderFilter = params.gender?.trim() ?? 'all'
  const statusFilter = params.status?.trim() ?? 'all'

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const schoolRole = await getUserSchoolContext(user.id)
  const schoolId = schoolRole?.school_id
  if (!schoolId) redirect('/dashboard')

  const { data: yearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)

  const activeYearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id

  let classesQuery = supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  if (activeYearId) {
    classesQuery = classesQuery.eq('school_year_id', activeYearId)
  }

  const { data: classesRaw } = await classesQuery
  const classes = ((classesRaw ?? []) as Array<{ id: string; name: string }>).map(c => ({
    id: c.id,
    name: c.name,
  }))

  let studentIdsForClass: string[] | null = null
  if (classFilter !== 'all') {
    const { data: enrollmentRows } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('school_id', schoolId)
      .eq('class_id', classFilter)

    studentIdsForClass = ((enrollmentRows ?? []) as Array<{ student_id: string }>).map(
      row => row.student_id
    )
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let studentsQuery = supabase
    .from('students')
    .select(
      'id, iun, first_name, last_name, birth_date, gender, phone, status, photo_url, created_at, student_enrollments(class_id, classes(name))',
      { count: 'exact' }
    )
    .eq('school_id', schoolId)

  if (studentIdsForClass !== null) {
    if (studentIdsForClass.length === 0) {
      return (
        <DashboardPage>
          <PageHeader
            title="Liste des élèves"
            description="0 élève"
          />
          <StudentsTable
            students={[]}
            page={1}
            totalPages={1}
            totalCount={0}
            classes={classes}
            filters={{ q: searchQuery, class: classFilter, gender: genderFilter, status: statusFilter }}
          />
        </DashboardPage>
      )
    }
    studentsQuery = studentsQuery.in('id', studentIdsForClass)
  }

  if (genderFilter === 'M' || genderFilter === 'F') {
    studentsQuery = studentsQuery.eq('gender', genderFilter)
  }

  if (statusFilter !== 'all') {
    studentsQuery = studentsQuery.eq('status', statusFilter)
  }

  if (searchQuery) {
    const term = searchQuery.replace(/[%_,]/g, '')
    studentsQuery = studentsQuery.or(
      `iun.ilike.%${term}%,last_name.ilike.%${term}%,first_name.ilike.%${term}%`
    )
  }

  const { data: studentsRaw, count } = await studentsQuery
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
  const hasFilters =
    searchQuery !== '' ||
    classFilter !== 'all' ||
    genderFilter !== 'all' ||
    statusFilter !== 'all'

  return (
    <DashboardPage>
      <PageHeader
        title="Liste des élèves"
        description={`${total} élève${total !== 1 ? 's' : ''}${hasFilters ? ' (filtres actifs)' : ''}`}
      />

      {total === 0 && !hasFilters ? (
        <EmptyPanel
          title="Aucun élève inscrit"
          description="Les élèves validés et inscrits apparaîtront ici."
        />
      ) : (
        <StudentsTable
          students={students as never}
          page={page}
          totalPages={totalPages}
          totalCount={total}
          classes={classes}
          filters={{ q: searchQuery, class: classFilter, gender: genderFilter, status: statusFilter }}
        />
      )}
    </DashboardPage>
  )
}
