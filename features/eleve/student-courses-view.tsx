'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileDown, Search } from 'lucide-react'
import type { StudentCourseResource } from '@/lib/eleve/get-student-course-resources'

const TYPE_LABELS: Record<string, string> = {
  document: 'Document',
  exercice: 'Exercice',
  correction: 'Correction',
  cours: 'Cours',
  autre: 'Autre',
}

type Props = {
  className: string
  resources: StudentCourseResource[]
}

export function StudentCoursesView({ className, resources }: Props) {
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')

  const subjects = useMemo(() => {
    const names = new Set(resources.map(r => r.subjectName))
    return [...names].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [resources])

  const teachers = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of resources) {
      map.set(r.teacherId, r.teacherName)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [resources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter(resource => {
      if (subjectFilter && resource.subjectName !== subjectFilter) return false
      if (teacherFilter && resource.teacherId !== teacherFilter) return false
      if (!q) return true
      return (
        resource.title.toLowerCase().includes(q)
        || resource.fileName.toLowerCase().includes(q)
        || resource.subjectName.toLowerCase().includes(q)
        || resource.teacherName.toLowerCase().includes(q)
        || (resource.description?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [resources, query, subjectFilter, teacherFilter])

  const grouped = useMemo(() => {
    const bySubject: Record<string, StudentCourseResource[]> = {}
    for (const resource of filtered) {
      const key = resource.subjectName
      if (!bySubject[key]) bySubject[key] = []
      bySubject[key].push(resource)
    }
    return Object.keys(bySubject)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map(subject => ({ subject, items: bySubject[subject] }))
  }, [filtered])

  const hasActiveFilters = Boolean(query.trim() || subjectFilter || teacherFilter)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Cours & ressources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documents publiés par vos professeurs pour{' '}
          <span className="font-medium text-gray-700">{className}</span>.
        </p>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un document…"
            className="h-10 w-full pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="h-10 w-full min-w-0 rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">Toutes les matières</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select
            value={teacherFilter}
            onChange={e => setTeacherFilter(e.target.value)}
            className="h-10 w-full min-w-0 rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">Tous les professeurs</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-gray-700">Aucune ressource pour le moment</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vos professeurs publieront ici leurs cours et documents.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-gray-700">Aucun résultat</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Essayez un autre mot-clé ou modifiez les filtres.
          </p>
        </div>
      ) : (
        grouped.map(({ subject, items }) => (
          <Card key={subject} className="overflow-hidden border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50 px-4 py-3 sm:px-6">
              <CardTitle className="text-sm font-semibold">{subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-4">
              {items.map(item => (
                <a
                  key={item.id}
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={item.fileName}
                  className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-slate-100 bg-gray-50/80 p-3 text-sm transition-colors active:bg-gray-100 sm:flex-row sm:items-center sm:gap-3 sm:p-3.5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B3A6B]/10">
                      <FileDown className="h-4 w-4 text-[#1B3A6B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-gray-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.teacherName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                        {item.fileName}
                      </p>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit shrink-0 self-start text-[10px] sm:self-center">
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
