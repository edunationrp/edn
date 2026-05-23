import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { Settings, Users } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('classes').select('name').eq('id', id).limit(1)
  const name = (data as Array<{ name: string }> | null)?.[0]?.name
  return { title: name ? `Classe ${name}` : 'Classe' }
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const { data: classRaw } = await supabase
    .from('classes')
    .select('id, name, capacity, class_levels(name), school_years(name)')
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const cls = (
    classRaw as Array<{
      id: string
      name: string
      capacity: number | null
      class_levels: { name: string } | null
      school_years: { name: string } | null
    }> | null
  )?.[0]

  if (!cls) notFound()

  const { data: yearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .limit(1)

  const yearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id

  const { data: enrollmentsRaw } = yearId
    ? await supabase
        .from('student_enrollments')
        .select('students(id, first_name, last_name, iun, status)')
        .eq('class_id', id)
        .eq('school_year_id', yearId)
    : { data: [] }

  const students = (
    (enrollmentsRaw ?? []) as Array<{
      students: {
        id: string
        first_name: string
        last_name: string
        iun: string
        status: string
      } | null
    }>
  )
    .map(row => row.students)
    .filter(Boolean) as Array<{
    id: string
    first_name: string
    last_name: string
    iun: string
    status: string
  }>

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={cls.name}
        description={`${cls.class_levels?.name ?? 'Niveau'} · ${cls.school_years?.name ?? 'Année scolaire'}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/classes/${id}/edit`}>
              <Settings className="h-4 w-4 mr-1" />
              Modifier
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacité</span>
              <span>{cls.capacity ?? '—'} élèves</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inscrits</span>
              <span>{students.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Élèves ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun élève inscrit dans cette classe.</p>
            ) : (
              <ul className="space-y-2">
                {students.map(student => (
                  <li key={student.id}>
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="flex items-center gap-3 rounded-lg border p-2.5 transition hover:bg-muted/30"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(`${student.first_name} ${student.last_name}`)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {student.last_name} {student.first_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.iun}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
