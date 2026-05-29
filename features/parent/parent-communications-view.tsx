'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone,
  CalendarDays,
  MailWarning,
  CheckCircle2,
  MapPin,
  Clock,
  User,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import {
  acknowledgeParentConvocation,
  markParentConvocationRead,
} from '@/lib/actions/parent-convocations'
import type {
  ParentAnnouncement,
  ParentConvocation,
  ParentMeeting,
} from '@/lib/parent/communications'
import { cn } from '@/lib/utils'
import {
  HideButton,
  ParentAnnouncementsSection,
} from '@/features/parent/parent-announcements-section'

function formatMeetingSchedule(meeting: ParentMeeting) {
  const date = formatDate(meeting.event_date)
  if (meeting.start_time) {
    const start = meeting.start_time.slice(0, 5)
    const end = meeting.end_time ? meeting.end_time.slice(0, 5) : null
    return end ? `${date} · ${start} – ${end}` : `${date} · ${start}`
  }
  return date
}

function EmptyBlock({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Megaphone
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 font-medium text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function ConvocationCard({
  convocation,
  studentId,
}: {
  convocation: ParentConvocation
  studentId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isUnread = !convocation.read_at
  const isAcknowledged = Boolean(convocation.acknowledged_at)

  function handleOpen() {
    startTransition(async () => {
      if (isUnread) await markParentConvocationRead(convocation.id)
      router.refresh()
    })
  }

  function handleAcknowledge() {
    startTransition(async () => {
      await acknowledgeParentConvocation(convocation.id)
      router.refresh()
    })
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md',
        isUnread ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200/90',
      )}
    >
      <div className={cn('h-1', isUnread ? 'bg-red-500' : isAcknowledged ? 'bg-emerald-500' : 'bg-slate-200')} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isUnread ? 'bg-red-100 text-red-600' : 'bg-[#1B3A6B]/10 text-[#1B3A6B]',
            )}
          >
            <MailWarning className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">{convocation.title}</h3>
              {isUnread ? (
                <Badge variant="destructive" className="shrink-0">Non lue</Badge>
              ) : isAcknowledged ? (
                <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Accusé reçu
                </Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">Lue</Badge>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {convocation.message}
            </p>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {convocation.convocation_date && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>Rendez-vous le {formatDate(convocation.convocation_date)}</span>
                </div>
              )}
              {convocation.location && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{convocation.location}</span>
                </div>
              )}
              {convocation.senderName && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>Envoyée par {convocation.senderName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Bell className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Reçue {formatRelativeDate(convocation.created_at)}</span>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-2">
                {isUnread && (
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleOpen}>
                    Marquer comme lue
                  </Button>
                )}
                {!isAcknowledged && (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5 bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
                    disabled={pending}
                    onClick={handleAcknowledge}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    J&apos;ai pris connaissance
                  </Button>
                )}
              </div>
              <HideButton
                studentId={studentId}
                itemType="convocation"
                itemId={convocation.id}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function MeetingCard({
  meeting,
  studentId,
}: {
  meeting: ParentMeeting
  studentId: string
}) {
  const day = new Date(meeting.event_date)
  const dayNum = day.getDate()
  const month = day.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')

  return (
    <article className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
        <span className="text-lg font-bold leading-none">{dayNum}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatMeetingSchedule(meeting)}
        </p>
        {meeting.room && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {meeting.room}
          </p>
        )}
        {meeting.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{meeting.description}</p>
        )}
        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
          <HideButton studentId={studentId} itemType="meeting" itemId={meeting.id} />
        </div>
      </div>
    </article>
  )
}

type Props = {
  studentId: string
  announcements: ParentAnnouncement[]
  meetings: ParentMeeting[]
  convocations: ParentConvocation[]
  schoolName: string
  childName: string
}

export function ParentCommunicationsView({
  studentId,
  announcements,
  meetings,
  convocations,
  schoolName,
  childName,
}: Props) {
  const unreadConvocations = convocations.filter(item => !item.read_at).length
  const defaultTab = unreadConvocations > 0 ? 'convocations' : 'announcements'

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-[#1B3A6B] px-5 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
          Espace parent · Communications
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          Informations de {schoolName}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Convocations personnelles, annonces de l&apos;école et réunions concernant{' '}
          <span className="font-semibold text-white">{childName}</span>.
        </p>
      </section>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-slate-100/80 p-1">
          <TabsTrigger value="convocations" className="gap-1.5 text-xs sm:text-sm">
            <MailWarning className="h-4 w-4 shrink-0" />
            <span className="truncate">Convocations</span>
            {unreadConvocations > 0 && (
              <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 px-1 text-[10px]">
                {unreadConvocations}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5 text-xs sm:text-sm">
            <Megaphone className="h-4 w-4 shrink-0" />
            <span className="truncate">Annonces</span>
            {announcements.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1 text-[10px]">
                {announcements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="truncate">Réunions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convocations" className="mt-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            Messages officiels du staff à lire et accuser réception. Vous pouvez retirer une convocation traitée de votre liste.
          </p>
          {convocations.length === 0 ? (
            <EmptyBlock
              icon={MailWarning}
              title="Aucune convocation"
              description={`Vous serez notifié ici des messages personnels concernant ${childName}.`}
            />
          ) : (
            <div className="space-y-3">
              {convocations.map(convocation => (
                <ConvocationCard
                  key={convocation.id}
                  convocation={convocation}
                  studentId={studentId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            Cliquez sur une carte pour voir l&apos;affiche, le texte complet et les documents. Retirez les annonces déjà lues de votre liste.
          </p>
          <ParentAnnouncementsSection
            announcements={announcements}
            studentId={studentId}
          />
        </TabsContent>

        <TabsContent value="meetings" className="mt-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            Conseils de classe, réunions parents-professeurs et rendez-vous planifiés.
          </p>
          {meetings.length === 0 ? (
            <EmptyBlock
              icon={CalendarDays}
              title="Aucune réunion planifiée"
              description="Les dates de réunions et événements collectifs seront affichées ici."
            />
          ) : (
            <div className="space-y-3">
              {meetings.map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} studentId={studentId} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
