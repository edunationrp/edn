'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, CalendarDays, MailWarning, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

function formatMeetingSchedule(meeting: ParentMeeting) {
  const date = formatDate(meeting.event_date)
  if (meeting.start_time) {
    const start = meeting.start_time.slice(0, 5)
    const end = meeting.end_time ? meeting.end_time.slice(0, 5) : null
    return end ? `${date} · ${start} – ${end}` : `${date} · ${start}`
  }
  return date
}

function ConvocationCard({ convocation }: { convocation: ParentConvocation }) {
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
    <Card className={isUnread ? 'border-[#1B3A6B]/30 bg-[#1B3A6B]/[0.02]' : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{convocation.title}</CardTitle>
          {isUnread ? (
            <Badge variant="destructive">Non lue</Badge>
          ) : isAcknowledged ? (
            <Badge className="bg-emerald-100 text-emerald-800">Accusé reçu</Badge>
          ) : (
            <Badge variant="secondary">Lue</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="whitespace-pre-wrap text-gray-700">{convocation.message}</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          {convocation.convocation_date && (
            <p>Rendez-vous : {formatDate(convocation.convocation_date)}</p>
          )}
          {convocation.location && <p>Lieu : {convocation.location}</p>}
          {convocation.senderName && <p>Envoyée par {convocation.senderName}</p>}
          <p>Reçue {formatRelativeDate(convocation.created_at)}</p>
        </div>
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
              className="gap-1 bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
              disabled={pending}
              onClick={handleAcknowledge}
            >
              <CheckCircle2 className="h-4 w-4" />
              J&apos;ai pris connaissance
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type Props = {
  announcements: ParentAnnouncement[]
  meetings: ParentMeeting[]
  convocations: ParentConvocation[]
  schoolName: string
  childName: string
}

export function ParentCommunicationsView({
  announcements,
  meetings,
  convocations,
  schoolName,
  childName,
}: Props) {
  const unreadConvocations = convocations.filter(item => !item.read_at).length

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MailWarning className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Convocations
            {unreadConvocations > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadConvocations} non lue(s)</Badge>
            )}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Messages personnels du staff concernant {childName}.
        </p>
        {convocations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune convocation pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {convocations.map(convocation => (
              <ConvocationCard key={convocation.id} convocation={convocation} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="text-base font-semibold text-gray-900">Annonces de l&apos;école</h2>
        </div>
        <p className="text-sm text-muted-foreground">{schoolName}</p>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune annonce publiée.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(announcement => (
              <Card key={announcement.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{announcement.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(announcement.published_at)}
                    {announcement.authorName ? ` · ${announcement.authorName}` : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">Réunions & rendez-vous</h2>
        </div>
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune réunion planifiée.</p>
        ) : (
          <div className="space-y-2">
            {meetings.map(meeting => (
              <Card key={meeting.id}>
                <CardContent className="py-3">
                  <p className="font-medium text-sm text-gray-900">{meeting.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatMeetingSchedule(meeting)}</p>
                  {meeting.room && (
                    <p className="text-xs text-muted-foreground">Lieu : {meeting.room}</p>
                  )}
                  {meeting.description && (
                    <p className="mt-2 text-sm text-gray-700">{meeting.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
