import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileDown } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cours & ressources — EduNation' }

const TYPE_LABELS: Record<string, string> = {
  document: 'Document',
  exercice: 'Exercice',
  correction: 'Correction',
  cours: 'Cours',
  autre: 'Autre',
}

export default async function EleveCoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, student_enrollments(class_id, school_year_id, school_years(is_active))')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as any
  if (!student) redirect('/login/eleve')

  const activeEnrollment = student.student_enrollments?.find((e: any) => e.school_years?.is_active)
  const classId = activeEnrollment?.class_id
  const schoolYearId = activeEnrollment?.school_year_id

  let resources: Array<{
    id: string
    title: string
    description: string | null
    file_url: string
    file_name: string
    type: string
    published_at: string | null
    subjects: { name: string } | null
    profiles: { full_name: string | null } | null
  }> = []

  if (classId && schoolYearId) {
    const { data } = await supabase
      .from('course_resources')
      .select('id, title, description, file_url, file_name, type, published_at, subjects(name), profiles(full_name)')
      .eq('class_id', classId)
      .eq('school_year_id', schoolYearId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    resources = (data ?? []) as typeof resources
  }

  // Grouper par matière
  const bySubject: Record<string, typeof resources> = {}
  for (const r of resources) {
    const key = r.subjects?.name ?? 'Général'
    if (!bySubject[key]) bySubject[key] = []
    bySubject[key].push(r)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Cours & ressources</h1>

      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune ressource disponible pour le moment.
        </p>
      ) : (
        Object.entries(bySubject).map(([subject, items]) => (
          <Card key={subject}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(item => (
                <a
                  key={item.id}
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={item.file_name}
                  className="flex items-center gap-3 rounded-md border bg-gray-50 px-3 py-2.5 text-sm transition-colors hover:bg-gray-100"
                >
                  <FileDown className="h-4 w-4 shrink-0 text-[#1B3A6B]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{item.title}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {item.profiles?.full_name ?? ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </Badge>
                </a>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
