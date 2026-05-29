'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, PartyPopper, Sparkles, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatRelativeDate } from '@/lib/utils'
import {
  deleteAnnouncement,
  updateAnnouncement,
} from '@/lib/actions/announcements'
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_TARGET_OPTIONS,
  categoryLabel,
  type AnnouncementCategory,
} from '@/lib/announcements/constants'
import type { StaffAnnouncementRow } from '@/lib/announcements/staff-queries'

const CATEGORY_STYLES: Record<AnnouncementCategory, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  event: 'bg-violet-100 text-violet-800 border-violet-200',
  info: 'bg-sky-100 text-sky-800 border-sky-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
}

type ClassOption = { id: string; label: string }

function targetLabel(row: StaffAnnouncementRow) {
  if (row.target_type === 'class') {
    return row.className ? `Classe : ${row.className}` : 'Une classe'
  }
  if (row.target_type === 'parents') return 'Tous les parents'
  return 'Toute l\'école'
}

function StaffAnnouncementEditDialog({
  row,
  classes,
  open,
  onOpenChange,
}: {
  row: StaffAnnouncementRow
  classes: ClassOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(row.title)
  const [content, setContent] = useState(row.content)
  const [category, setCategory] = useState<AnnouncementCategory>(row.category)
  const [targetType, setTargetType] = useState<'all' | 'parents' | 'class'>(
    row.target_type as 'all' | 'parents' | 'class',
  )
  const [targetId, setTargetId] = useState(row.target_id ?? classes[0]?.id ?? '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)

    const result = await updateAnnouncement({
      id: row.id,
      title,
      content,
      category,
      targetType,
      targetId: targetType === 'class' ? targetId : undefined,
      coverImageUrl: row.cover_image_url,
      attachmentUrl: row.attachment_url,
      attachmentName: row.attachment_name,
    })

    setPending(false)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;annonce</DialogTitle>
          <DialogDescription>
            Les parents seront notifiés de la mise à jour.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-title-${row.id}`}>Titre</Label>
            <Input
              id={`edit-title-${row.id}`}
              value={title}
              onChange={event => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={v => setCategory(v as AnnouncementCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_CATEGORIES.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destinataires</Label>
              <Select
                value={targetType}
                onValueChange={v => setTargetType(v as 'all' | 'parents' | 'class')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_TARGET_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {targetType === 'class' && (
            <div className="space-y-1.5">
              <Label>Classe</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={`edit-content-${row.id}`}>Texte</Label>
            <textarea
              id={`edit-content-${row.id}`}
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={5}
              className={cn(
                'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            />
          </div>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90">
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function StaffAnnouncementListItem({
  row,
  classes,
}: {
  row: StaffAnnouncementRow
  classes: ClassOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!window.confirm(`Retirer l'annonce « ${row.title} » ? Elle disparaîtra pour tous les parents.`)) {
      return
    }
    setPending(true)
    setError('')
    const result = await deleteAnnouncement(row.id)
    setPending(false)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {row.cover_image_url && (
          <div className="h-24 overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.cover_image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('text-[11px]', CATEGORY_STYLES[row.category])}>
              {row.category === 'event' && <PartyPopper className="mr-1 h-3 w-3" />}
              {row.category === 'info' && <Sparkles className="mr-1 h-3 w-3" />}
              {row.category === 'urgent' && <Bell className="mr-1 h-3 w-3" />}
              {categoryLabel(row.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(row.published_at)}
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-slate-900">{row.title}</h3>
          {row.content && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{row.content}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{targetLabel(row)}</p>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Retirer
            </Button>
          </div>
        </div>
      </article>

      <StaffAnnouncementEditDialog
        row={row}
        classes={classes}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
