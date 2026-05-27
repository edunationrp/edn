import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { formatDate, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils'
import { canAccessStudentRegistry } from '@/lib/students/registry-access'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('students').select('first_name, last_name').eq('id', id).limit(1)
  const student = (data as Array<{ first_name: string; last_name: string }> | null)?.[0]
  return {
    title: student ? `${student.last_name} ${student.first_name}` : 'Fiche élève',
  }
}

export default async function StudentDetailPage({
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
  if (!canAccessStudentRegistry(ctx.role_code)) {
    redirect('/dashboard')
  }

  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id, iun, first_name, last_name, birth_date, gender, phone, status, created_at,
      student_enrollments(class_id, classes(name), school_years(name))
    `)
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const student = (
    studentRaw as Array<{
      id: string
      iun: string
      first_name: string
      last_name: string
      birth_date: string
      gender: 'M' | 'F'
      phone: string | null
      status: string
      created_at: string
      student_enrollments: Array<{
        class_id: string
        classes: { name: string } | null
        school_years: { name: string } | null
      }>
    }> | null
  )?.[0]

  if (!student) notFound()

  const enrollment = student.student_enrollments?.[0]

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={`${student.last_name} ${student.first_name}`}
        description={`IUN ${student.iun}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/students">Retour à la liste</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {getInitials(`${student.first_name} ${student.last_name}`)}
            </div>
            <div>
              <Badge className={getStatusColor(student.status)}>{getStatusLabel(student.status)}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Inscrit le {formatDate(student.created_at)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Classe</p>
              <p className="font-medium">{enrollment?.classes?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Année scolaire</p>
              <p className="font-medium">{enrollment?.school_years?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Genre</p>
              <p className="font-medium">{student.gender === 'M' ? 'Garçon' : 'Fille'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date de naissance</p>
              <p className="font-medium">{formatDate(student.birth_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium">{student.phone ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
