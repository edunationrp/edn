'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone,
  FileText,
  Download,
  Sparkles,
  PartyPopper,
  Bell,
  Trash2,
  ImageIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  parseAnnouncementContent,
  resolveAnnouncementCategory,
} from '@/lib/parent/announcement-content'
import { hideParentCommunicationItem } from '@/lib/actions/parent-communications'
import type { ParentAnnouncement } from '@/lib/parent/communications'

const CATEGORY_STYLES = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  event: 'bg-violet-100 text-violet-800 border-violet-200',
  info: 'bg-sky-100 text-sky-800 border-sky-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
} as const

function useAnnouncementMedia(announcement: ParentAnnouncement) {
  return useMemo(() => {
    const parsed = parseAnnouncementContent(announcement.content)
    const category = resolveAnnouncementCategory(announcement.title, announcement.category)
    const coverImage = announcement.cover_image_url ?? parsed.imageUrls[0] ?? null
    const extraImages = announcement.cover_image_url
      ? parsed.imageUrls
      : parsed.imageUrls.slice(1)
    const pdfLinks = [
      ...(announcement.attachment_url
        ? [{ url: announcement.attachment_url, label: announcement.attachment_name ?? 'Document PDF' }]
        : []),
      ...parsed.pdfLinks.filter(link => link.url !== announcement.attachment_url),
    ]

    return {
      parsed,
      category,
      coverImage,
      extraImages,
      pdfLinks,
      excerpt: parsed.body.slice(0, 120) || (coverImage ? 'Affiche et informations visuelles' : ''),
    }
  }, [announcement])
}

function HideButton({
  studentId,
  itemType,
  itemId,
  label = 'Retirer de ma liste',
}: {
  studentId: string
  itemType: 'announcement' | 'convocation' | 'meeting'
  itemId: string
  label?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleHide() {
    startTransition(async () => {
      await hideParentCommunicationItem({ studentId, itemType, itemId })
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleHide}
      className="gap-1.5 text-slate-500 hover:text-red-600"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? 'Suppression…' : label}
    </Button>
  )
}

function AnnouncementDetailDialog({
  announcement,
  open,
  onOpenChange,
  studentId,
}: {
  announcement: ParentAnnouncement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
}) {
  const media = useAnnouncementMedia(announcement ?? {
    id: '',
    title: '',
    content: '',
    category: 'general',
    cover_image_url: null,
    attachment_url: null,
    attachment_name: null,
    target_type: 'all',
    published_at: '',
    updated_at: null,
    authorName: null,
  })

  if (!announcement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <Badge variant="outline" className={cn('text-[11px]', CATEGORY_STYLES[media.category.tone])}>
              {media.category.tone === 'event' && <PartyPopper className="mr-1 h-3 w-3" />}
              {media.category.tone === 'info' && <Sparkles className="mr-1 h-3 w-3" />}
              {media.category.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(announcement.published_at)}
              {announcement.updated_at && announcement.updated_at !== announcement.published_at && (
                <> · Modifiée {formatRelativeDate(announcement.updated_at)}</>
              )}
            </span>
          </div>
          <DialogTitle className="text-left text-xl">{announcement.title}</DialogTitle>
          <DialogDescription className="sr-only">Détail de l&apos;annonce</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {media.coverImage && (
            <div className="overflow-hidden rounded-xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.coverImage} alt="" className="block w-full h-auto" />
            </div>
          )}

          {media.parsed.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {media.parsed.body}
            </p>
          )}

          {media.extraImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {media.extraImages.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-lg bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="block w-full h-auto" />
                </a>
              ))}
            </div>
          )}

          {media.pdfLinks.length > 0 && (
            <div className="space-y-2">
              {media.pdfLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 transition hover:border-[#1B3A6B]/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{link.label}</p>
                    <p className="text-xs text-muted-foreground">Document PDF</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          )}

          {announcement.authorName && (
            <p className="text-xs text-muted-foreground">
              Publié par {announcement.authorName}
              {announcement.target_type === 'class' ? ' · Classe de votre enfant' : ' · Toute l\'école'}
            </p>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <HideButton studentId={studentId} itemType="announcement" itemId={announcement.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AnnouncementGridCard({
  announcement,
  onOpen,
}: {
  announcement: ParentAnnouncement
  onOpen: () => void
}) {
  const media = useAnnouncementMedia(announcement)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition hover:border-[#1B3A6B]/25 hover:shadow-md"
    >
      {media.coverImage ? (
        <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.coverImage}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#1B3A6B]/8 to-slate-100 sm:h-28">
          <Megaphone className="h-8 w-8 text-[#1B3A6B]/35" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={cn('text-[10px]', CATEGORY_STYLES[media.category.tone])}>
            {media.category.label}
          </Badge>
          {media.coverImage && (
            <ImageIcon className="h-3 w-3 text-slate-400" aria-hidden />
          )}
          {media.pdfLinks.length > 0 && (
            <FileText className="h-3 w-3 text-slate-400" aria-hidden />
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {announcement.title}
        </h3>
        {media.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {media.excerpt}
          </p>
        )}
        <p className="mt-auto pt-3 text-[11px] text-muted-foreground">
          {formatRelativeDate(announcement.published_at)} · Voir le détail
        </p>
      </div>
    </button>
  )
}

type Props = {
  announcements: ParentAnnouncement[]
  studentId: string
}

export function ParentAnnouncementsSection({ announcements, studentId }: Props) {
  const [selected, setSelected] = useState<ParentAnnouncement | null>(null)

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
        <Megaphone className="h-10 w-10 text-slate-300" />
        <p className="mt-4 font-medium text-slate-900">Aucune annonce publiée</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Les annonces de l&apos;école apparaîtront ici sous forme de cartes cliquables.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {announcements.map(announcement => (
          <AnnouncementGridCard
            key={announcement.id}
            announcement={announcement}
            onOpen={() => setSelected(announcement)}
          />
        ))}
      </div>

      <AnnouncementDetailDialog
        announcement={selected}
        open={Boolean(selected)}
        onOpenChange={open => {
          if (!open) setSelected(null)
        }}
        studentId={studentId}
      />
    </>
  )
}

export { HideButton }
