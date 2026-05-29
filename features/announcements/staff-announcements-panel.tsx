'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone,
  ImageIcon,
  FileText,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createAnnouncement } from '@/lib/actions/announcements'
import { uploadAnnouncementFile } from '@/lib/announcements/upload-client'
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_TARGET_OPTIONS,
  type AnnouncementCategory,
} from '@/lib/announcements/constants'
import { StaffAnnouncementListItem } from '@/features/announcements/staff-announcement-list-item'
import type { StaffAnnouncementRow } from '@/lib/announcements/staff-queries'

type ClassOption = { id: string; label: string }

type Props = {
  schoolId: string
  announcements: StaffAnnouncementRow[]
  classes: ClassOption[]
}

export function StaffAnnouncementsPanel({ schoolId, announcements, classes }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<AnnouncementCategory>('general')
  const [targetType, setTargetType] = useState<'all' | 'parents' | 'class'>('parents')
  const [targetId, setTargetId] = useState(classes[0]?.id ?? '')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function clearCover() {
    setCoverFile(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setPending(true)

    if (!content.trim() && !coverFile && !attachmentFile) {
      setPending(false)
      setError('Ajoutez un texte, une image ou un PDF.')
      return
    }

    let coverImageUrl: string | undefined
    let attachmentUrl: string | undefined
    let attachmentName: string | undefined

    if (coverFile) {
      const uploaded = await uploadAnnouncementFile(schoolId, coverFile, 'cover')
      if ('error' in uploaded) {
        setPending(false)
        setError(uploaded.error)
        return
      }
      coverImageUrl = uploaded.publicUrl
    }

    if (attachmentFile) {
      const uploaded = await uploadAnnouncementFile(schoolId, attachmentFile, 'attachment')
      if ('error' in uploaded) {
        setPending(false)
        setError(uploaded.error)
        return
      }
      attachmentUrl = uploaded.publicUrl
      attachmentName = uploaded.fileName
    }

    const result = await createAnnouncement({
      title,
      content,
      category,
      targetType,
      targetId: targetType === 'class' ? targetId : undefined,
      coverImageUrl,
      attachmentUrl,
      attachmentName,
    })
    setPending(false)

    if ('error' in result && result.error) {
      setError(result.error)
      return
    }

    setSuccess('Annonce publiée. Les parents la verront dans leur espace.')
    setTitle('')
    setContent('')
    setCategory('general')
    setTargetType('parents')
    clearCover()
    setAttachmentFile(null)
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="border-slate-200/90 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-[#1B3A6B]" />
            Nouvelle annonce
          </CardTitle>
          <CardDescription>
            Publiez une actualité pour les parents : texte, affiche ou document PDF — sans markdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="announcement-title">Titre</Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Ex. Journée portes ouvertes"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={value => setCategory(value as AnnouncementCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_CATEGORIES.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Destinataires</Label>
                <Select
                  value={targetType}
                  onValueChange={value => setTargetType(value as 'all' | 'parents' | 'class')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_TARGET_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {targetType === 'class' && (
              <div className="space-y-1.5">
                <Label>Classe</Label>
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune classe disponible.</p>
                ) : (
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="announcement-content">Texte (optionnel si image ou PDF)</Label>
              <textarea
                id="announcement-content"
                value={content}
                onChange={event => setContent(event.target.value)}
                placeholder="Informations complémentaires pour les parents..."
                rows={5}
                className={cn(
                  'flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cover-image">Image / affiche (optionnel)</Label>
                <label
                  htmlFor="cover-image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center transition hover:border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/5"
                >
                  {coverPreview ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverPreview} alt="" className="mx-auto max-h-36 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={event => {
                          event.preventDefault()
                          clearCover()
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
                      >
                        <X className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                      <span className="mt-2 text-sm font-medium text-slate-700">Ajouter une image</span>
                      <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP · max 10 Mo</span>
                    </>
                  )}
                  <input
                    id="cover-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleCoverChange}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="attachment-pdf">Document PDF (optionnel)</Label>
                <label
                  htmlFor="attachment-pdf"
                  className="flex h-full min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center transition hover:border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/5"
                >
                  {attachmentFile ? (
                    <div className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2 text-left shadow-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attachmentFile.name}</p>
                        <p className="text-xs text-muted-foreground">PDF sélectionné</p>
                      </div>
                      <button
                        type="button"
                        onClick={event => {
                          event.preventDefault()
                          setAttachmentFile(null)
                        }}
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400" />
                      <span className="mt-2 text-sm font-medium text-slate-700">Joindre un PDF</span>
                      <span className="mt-1 text-xs text-muted-foreground">Circulaire, programme… · max 10 Mo</span>
                    </>
                  )}
                  <input
                    id="attachment-pdf"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={event => setAttachmentFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

            <Button
              type="submit"
              disabled={pending || (targetType === 'class' && classes.length === 0)}
              className="w-full bg-[#1B3A6B] hover:bg-[#1B3A6B]/90 sm:w-auto"
            >
              {pending ? 'Publication…' : 'Publier l\'annonce'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Annonces récentes</h2>
          <p className="text-sm text-muted-foreground">
            {announcements.length} publication(s) visible(s) par les parents concernés.
          </p>
        </div>

        {announcements.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <Megaphone className="h-10 w-10 text-slate-300" />
            <p className="mt-4 font-medium text-slate-900">Aucune annonce publiée</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Les annonces apparaîtront ici après publication.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(row => (
              <StaffAnnouncementListItem key={row.id} row={row} classes={classes} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
