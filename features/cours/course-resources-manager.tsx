'use client'

import { useState, useTransition } from 'react'
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
import type { InsertTables } from '@/types/database.types'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  classId: z.string().uuid('Classe requise'),
  subjectId: z.string().optional(),
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

type Props = {
  schoolId: string
  userId: string
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
  schoolYearId: string | null
}

export function CourseResourcesManager({ schoolId, userId, classes, subjects, schoolYearId }: Props) {
  const supabase = createClient()
  const [resources, setResources] = useState<Resource[]>([])
  const [loaded, setLoaded] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState('')
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function loadResources() {
    const { data } = await supabase
      .from('course_resources')
      .select('id, title, description, file_name, type, is_published, class_id, subjects(name), classes(name)')
      .eq('school_id', schoolId)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })
    setResources((data ?? []) as Resource[])
    setLoaded(true)
  }

  if (!loaded) {
    loadResources()
  }

  async function onSubmit(data: FormData) {
    setServerError('')
    if (!file) { setServerError('Veuillez sélectionner un fichier'); return }
    if (!schoolYearId) { setServerError('Aucune année scolaire active'); return }

    const ext = file.name.split('.').pop()
    const path = `${schoolId}/${data.classId}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('course-resources')
      .upload(path, file, { upsert: false })

    if (uploadErr) { setServerError(uploadErr.message); return }

    const { data: urlData } = supabase.storage.from('course-resources').getPublicUrl(path)
    const fileUrl = urlData.publicUrl

    const insertRow: InsertTables<'course_resources'> = {
      school_id: schoolId,
      class_id: data.classId,
      subject_id: data.subjectId || null,
      school_year_id: schoolYearId,
      uploaded_by: userId,
      title: data.title,
      description: data.description || null,
      file_url: fileUrl,
      file_name: file.name,
      file_size_bytes: file.size,
      type: data.type,
      is_published: false,
    }

    const { error: insertErr } = await (supabase as any).from('course_resources').insert(insertRow)

    if (insertErr) { setServerError(insertErr.message); return }

    reset()
    setFile(null)
    loadResources()
  }

  async function togglePublish(id: string, current: boolean) {
    await (supabase as any)
      .from('course_resources')
      .update({ is_published: !current, published_at: !current ? new Date().toISOString() : null })
      .eq('id', id)
    setResources(prev => prev.map(r => r.id === id ? { ...r, is_published: !current } : r))
  }

  async function deleteResource(id: string) {
    await (supabase as any).from('course_resources').delete().eq('id', id)
    setResources(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ajouter une ressource</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Titre</Label>
                <Input {...register('title')} placeholder="Nom du document" />
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
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.classId && <p className="text-xs text-destructive">{errors.classId.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Matière (optionnel)</Label>
                <select {...register('subjectId')} className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="">Toutes</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description (optionnel)</Label>
              <Input {...register('description')} placeholder="Description courte" />
            </div>
            <div className="space-y-1">
              <Label>Fichier</Label>
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
              {isSubmitting ? 'Envoi…' : 'Ajouter'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Mes ressources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ressource pour l'instant.</p>
          ) : (
            resources.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.classes?.name} · {r.subjects?.name ?? 'Général'} · {r.file_name}
                  </p>
                </div>
                <Badge variant={r.is_published ? 'default' : 'secondary'} className="shrink-0">
                  {r.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
                <button
                  onClick={() => togglePublish(r.id, r.is_published)}
                  title={r.is_published ? 'Dépublier' : 'Publier'}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
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
