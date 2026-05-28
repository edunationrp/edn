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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cours & ressources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documents publiés par vos professeurs pour {className}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par nom de document…"
            className="pl-9"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="h-9 rounded-md border bg-white px-3 text-sm"
        >
          <option value="">Toutes les matières</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <select
          value={teacherFilter}
          onChange={e => setTeacherFilter(e.target.value)}
          className="h-9 rounded-md border bg-white px-3 text-sm"
        >
          <option value="">Tous les professeurs</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune ressource publiée pour votre classe pour le moment.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun document ne correspond à votre recherche.
        </p>
      ) : (
        grouped.map(({ subject, items }) => (
          <Card key={subject}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(item => (
                <a
                  key={item.id}
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={item.fileName}
                  className="flex items-center gap-3 rounded-md border bg-gray-50 px-3 py-2.5 text-sm transition-colors hover:bg-gray-100"
                >
                  <FileDown className="h-4 w-4 shrink-0 text-[#1B3A6B]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.teacherName} · {item.fileName}
                    </p>
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
