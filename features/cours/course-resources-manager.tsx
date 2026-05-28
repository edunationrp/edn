'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { revalidateStudentCourses, notifyStudentsCoursePublished } from '@/lib/actions/course-resources'
import { notify } from '@/lib/feedback/toast'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  classId: z.string().uuid('Classe requise'),
  subjectId: z.string().uuid('Matière requise'),
  type: z.enum(['document', 'exercice', 'correction', 'cours', 'autre']),
})
type FormData = z.infer<typeof schema>

type Resource = {
  id: string
  title: string
  description: string | null
  file_name: string
  type: string
  is_published: boolean
  class_id: string
  subjects: { name: string } | null
  classes: { name: string } | null
}

type TeacherAssignment = {
  classId: string
  className: string
  subjectId: string
  subjectName: string
}

type Props = {
  schoolId: string
  userId: string
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
  schoolYearId: string | null
  teacherAssignments?: TeacherAssignment[]
}

export function CourseResourcesManager({
  schoolId,
  userId,
  classes,
  subjects,
  schoolYearId,
  teacherAssignments = [],
}: Props) {
  const supabase = createClient()
  const [resources, setResources] = useState<Resource[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState('')
  const isTeacherScoped = teacherAssignments.length > 0

  const availableClasses = useMemo(() => {
    if (!isTeacherScoped) return classes
    const ids = new Set(teacherAssignments.map(a => a.classId))
    return classes.filter(c => ids.has(c.id))
  }, [classes, isTeacherScoped, teacherAssignments])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedClassId = watch('classId')

  const availableSubjects = useMemo(() => {
    if (!isTeacherScoped) return subjects
    if (!selectedClassId) {
      const ids = new Set(teacherAssignments.map(a => a.subjectId))
      return subjects.filter(s => ids.has(s.id))
    }
    const ids = new Set(
      teacherAssignments.filter(a => a.classId === selectedClassId).map(a => a.subjectId),
    )
    return subjects.filter(s => ids.has(s.id))
  }, [subjects, isTeacherScoped, teacherAssignments, selectedClassId])

  async function loadResources() {
    const { data } = await supabase
      .from('course_resources')
      .select('id, title, description, file_name, type, is_published, class_id, subjects(name), classes(name)')
      .eq('school_id', schoolId)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })
    setResources((data ?? []) as Resource[])
  }

  useEffect(() => {
    loadResources()
  }, [schoolId, userId])

  async function onSubmit(data: FormData) {
    setServerError('')
    if (!file) { setServerError('Veuillez sélectionner un fichier'); return }
    if (!schoolYearId) { setServerError('Aucune année scolaire active'); return }

    const path = `${schoolId}/${data.classId}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('course-resources')
      .upload(path, file, { upsert: false })

    if (uploadErr) { setServerError(uploadErr.message); return }

    const { data: urlData } = supabase.storage.from('course-resources').getPublicUrl(path)
    const now = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (supabase as any).from('course_resources').insert({
      school_id: schoolId,
      class_id: data.classId,
      subject_id: data.subjectId,
      school_year_id: schoolYearId,
      uploaded_by: userId,
      title: data.title,
      description: data.description || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size_bytes: file.size,
      type: data.type,
      is_published: true,
      published_at: now,
    })

    if (insertErr) { setServerError(insertErr.message); return }

    const subjectName = availableSubjects.find(s => s.id === data.subjectId)?.name ?? 'Matière'
    await notifyStudentsCoursePublished({
      schoolId,
      classId: data.classId,
      title: data.title,
      subjectName,
    })
    await revalidateStudentCourses()
    reset()
    setFile(null)
    await loadResources()
    notify.success('Cours publié', { description: 'Visible par tous les élèves de la classe.' })
  }

  function mutateResource(id: string, updater: (list: Resource[]) => Resource[]) {
    setResources(updater)
  }

  async function togglePublish(id: string, current: boolean) {
    const next = !current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('course_resources')
      .update({ is_published: next, published_at: next ? new Date().toISOString() : null })
      .eq('id', id)
    mutateResource(id, prev => prev.map(r => r.id === id ? { ...r, is_published: next } : r))
    await revalidateStudentCourses()
  }

  async function deleteResource(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('course_resources').delete().eq('id', id)
    mutateResource(id, prev => prev.filter(r => r.id !== id))
    await revalidateStudentCourses()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Publier un cours pour ma classe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Titre du document</Label>
                <Input {...register('title')} placeholder="Ex. Chapitre 3 — Les fractions" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <select {...register('type')} className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="cours">Cours</option>
                  <option value="exercice">Exercice</option>
                  <option value="correction">Correction</option>
                  <option value="document">Document</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Classe</Label>
                <select {...register('classId')} className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="">Sélectionner…</option>
                  {availableClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.classId && <p className="text-xs text-destructive">{errors.classId.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Matière</Label>
                <select {...register('subjectId')} className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="">Sélectionner…</option>
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description (optionnel)</Label>
              <Input {...register('description')} placeholder="Description courte" />
            </div>
            <div className="space-y-1">
              <Label>Fichier (PDF, Word, Excel, PowerPoint, image)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
            </div>
            {serverError && (
              <p className="text-xs text-destructive">{serverError}</p>
            )}
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Upload className="h-4 w-4" />
              {isSubmitting ? 'Publication…' : 'Publier pour la classe'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Le document est immédiatement visible par tous les élèves de la classe sélectionnée.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Mes ressources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ressource pour l&apos;instant.</p>
          ) : (
            resources.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.classes?.name} · {r.subjects?.name ?? '—'} · {r.file_name}
                  </p>
                </div>
                <Badge variant={r.is_published ? 'default' : 'secondary'} className="shrink-0">
                  {r.is_published ? 'Publié' : 'Masqué'}
                </Badge>
                <button
                  type="button"
                  onClick={() => togglePublish(r.id, r.is_published)}
                  title={r.is_published ? 'Masquer aux élèves' : 'Republier'}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => deleteResource(r.id)}
                  title="Supprimer"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
