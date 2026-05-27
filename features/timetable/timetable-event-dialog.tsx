'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '@/lib/actions/timetable'
import { CALENDAR_EVENT_LABELS } from '@/lib/timetable/grid-utils'
import { notify } from '@/lib/feedback/toast'
import type { CalendarEventType, CalendarEventView, TimetableClassOption } from '@/lib/timetable/types'
import { CalendarDays, Trash2 } from 'lucide-react'

type TimetableEventDialogProps = {
  open: boolean
  event: CalendarEventView | null
  defaultDate?: string
  classes: TimetableClassOption[]
  canManage: boolean
  onClose: () => void
}

const EVENT_TYPES = Object.keys(CALENDAR_EVENT_LABELS) as CalendarEventType[]

function buildForm(event: CalendarEventView | null, defaultDate: string) {
  if (event) {
    return {
      eventType: event.eventType,
      title: event.title,
      description: event.description ?? '',
      eventDate: event.eventDate,
      endDate: event.endDate ?? '',
      allDay: event.allDay,
      startTime: event.startTime ?? '08:00',
      endTime: event.endTime ?? '09:00',
      classId: event.classId ?? '',
    }
  }
  return {
    eventType: 'event' as CalendarEventType,
    title: '',
    description: '',
    eventDate: defaultDate,
    endDate: '',
    allDay: true,
    startTime: '08:00',
    endTime: '09:00',
    classId: '',
  }
}

export function TimetableEventDialog({
  open,
  event,
  defaultDate,
  classes,
  canManage,
  onClose,
}: TimetableEventDialogProps) {
  const dateKey = defaultDate ?? new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState(() => buildForm(event, dateKey))
  const [isPending, startTransition] = useTransition()

  const isEdit = Boolean(event)

  function handleOpenChange(value: boolean) {
    if (value) setForm(buildForm(event, dateKey))
    else onClose()
  }

  function handleSubmit() {
    startTransition(async () => {
      const payload = {
        eventType: form.eventType,
        title: form.title,
        description: form.description || null,
        eventDate: form.eventDate,
        endDate: form.endDate || null,
        allDay: form.allDay,
        startTime: form.allDay ? null : form.startTime,
        endTime: form.allDay ? null : form.endTime,
        classId: form.classId || null,
        subjectId: null,
        teacherId: null,
        room: null,
      }

      const result = isEdit && event
        ? await updateCalendarEvent(event.id, payload)
        : await createCalendarEvent(payload)

      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success(isEdit ? 'Événement mis à jour' : 'Événement ajouté au calendrier')
      onClose()
    })
  }

  function handleDelete() {
    if (!event || !canManage || !confirm('Supprimer cet événement ?')) return
    startTransition(async () => {
      const result = await deleteCalendarEvent(event.id)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Événement supprimé')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'événement' : 'Ajouter au calendrier'}</DialogTitle>
          <DialogDescription>
            Devoirs, évaluations, fériés ou événements visibles sur le calendrier scolaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Type</label>
              <select
                value={form.eventType}
                onChange={eventChange => setForm(current => ({
                  ...current,
                  eventType: eventChange.target.value as CalendarEventType,
                }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>{CALENDAR_EVENT_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Classe (optionnel)</label>
              <select
                value={form.classId}
                onChange={eventChange => setForm(current => ({ ...current, classId: eventChange.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
              >
                <option value="">Toute l&apos;école</option>
                {classes.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Titre</label>
            <Input
              value={form.title}
              onChange={eventChange => setForm(current => ({ ...current, title: eventChange.target.value }))}
              placeholder="Ex. Contrôle de mathématiques"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={eventChange => setForm(current => ({ ...current, description: eventChange.target.value }))}
              placeholder="Détail du jour, consignes, lieu..."
              className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-[#7AB832]/50 focus:ring-2 focus:ring-[#7AB832]/20"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Date de début</label>
              <Input
                type="date"
                value={form.eventDate}
                onChange={eventChange => setForm(current => ({ ...current, eventDate: eventChange.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Date de fin (optionnel)</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={eventChange => setForm(current => ({ ...current, endDate: eventChange.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={eventChange => setForm(current => ({ ...current, allDay: eventChange.target.checked }))}
              className="rounded border-slate-300"
            />
            Journée entière
          </label>

          {!form.allDay && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500">Heure de début</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={eventChange => setForm(current => ({ ...current, startTime: eventChange.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Heure de fin</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={eventChange => setForm(current => ({ ...current, endTime: eventChange.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit && canManage ? (
            <Button type="button" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="button" variant="navy" onClick={handleSubmit} disabled={isPending}>
              <CalendarDays className="h-4 w-4" />
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
