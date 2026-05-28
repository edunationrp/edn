import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileDown } from 'lucide-react'
import { getStudentEnrollmentContext } from '@/lib/eleve/student-context'
import { extractCourseResourceStoragePath } from '@/lib/eleve/course-resources'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cours & ressources — EduNation' }

const TYPE_LABELS: Record<string, string> = {
  document: 'Document',
  exercice: 'Exercice',
  correction: 'Correction',
  cours: 'Cours',
  autre: 'Autre',
}

type ResourceRow = {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string
  type: string
  published_at: string | null
  subject_id: string | null
  subjects: { name: string } | null
}

export default async function EleveCoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const ctx = await getStudentEnrollmentContext(user.id)
  if (!ctx) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Cours & ressources</h1>
        <p className="text-sm text-muted-foreground">
          Aucune inscription active trouvée. Contactez le secrétariat de votre établissement.
        </p>
      </div>
    )
  }

  const { data: slotsRaw } = await supabase
    .from('timetable_slots')
    .select('subject_id')
    .eq('school_id', ctx.schoolId)
    .eq('school_year_id', ctx.schoolYearId)
    .eq('class_id', ctx.classId)

  const classSubjectIds = new Set(
    ((slotsRaw ?? []) as Array<{ subject_id: string | null }>)
      .map(row => row.subject_id)
      .filter((id): id is string => !!id),
  )

  const { data: resourcesRaw } = await supabase
    .from('course_resources')
    .select('id, title, description, file_url, file_name, type, published_at, subject_id, subjects(name)')
    .eq('class_id', ctx.classId)
    .eq('school_year_id', ctx.schoolYearId)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const filtered = ((resourcesRaw ?? []) as ResourceRow[]).filter(resource => {
    if (!resource.subject_id) return true
    if (classSubjectIds.size === 0) return true
    return classSubjectIds.has(resource.subject_id)
  })

  const resources = await Promise.all(
    filtered.map(async resource => {
      const storagePath = extractCourseResourceStoragePath(resource.file_url)
      let downloadUrl = resource.file_url

      if (storagePath) {
        const { data: signed } = await supabase.storage
          .from('course-resources')
          .createSignedUrl(storagePath, 3600)
        if (signed?.signedUrl) downloadUrl = signed.signedUrl
      }

      return { ...resource, downloadUrl }
    }),
  )

  const bySubject: Record<string, typeof resources> = {}
  for (const resource of resources) {
    const key = resource.subjects?.name ?? 'Général'
    if (!bySubject[key]) bySubject[key] = []
    bySubject[key].push(resource)
  }

  const subjectKeys = Object.keys(bySubject).sort((a, b) => a.localeCompare(b, 'fr'))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cours & ressources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documents publiés par vos professeurs pour {ctx.className}.
        </p>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune ressource publiée pour votre classe pour le moment.
        </p>
      ) : (
        subjectKeys.map(subject => (
          <Card key={subject}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bySubject[subject].map(item => (
                <a
                  key={item.id}
                  href={item.downloadUrl}
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
