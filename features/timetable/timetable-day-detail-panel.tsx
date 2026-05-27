'use client'

import { buildDaySchedule } from '@/lib/timetable/calendar-utils'
import { CALENDAR_EVENT_COLORS, CALENDAR_EVENT_LABELS } from '@/lib/timetable/grid-utils'
import type { CalendarEventView, DayScheduleItem, TimetableSlotView } from '@/lib/timetable/types'
import { BookOpen, Calendar, Clock, X } from 'lucide-react'

type TimetableDayDetailPanelProps = {
  dateKey: string
  slots: TimetableSlotView[]
  events: CalendarEventView[]
  filterClassId?: string
  filterTeacherId?: string
  canManage?: boolean
  canAddEvents?: boolean
  onClose: () => void
  onAddEvent?: () => void
  onEditEvent?: (event: CalendarEventView) => void
}

function formatDisplayDate(dateKey: string) {
  const date = new Date(dateKey + 'T12:00:00')
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ScheduleItemRow({
  item,
  onEditEvent,
  events,
}: {
  item: DayScheduleItem
  onEditEvent?: (event: CalendarEventView) => void
  events: CalendarEventView[]
}) {
  const isHoliday = item.kind === 'holiday'
  const eventColor = item.eventType ? CALENDAR_EVENT_COLORS[item.eventType] : 'bg-slate-100 text-slate-800 border-slate-200'

  const linkedEvent = item.kind !== 'course'
    ? events.find(event => event.id === item.id)
    : null

  return (
    <button
      type="button"
      disabled={!linkedEvent || !onEditEvent}
      onClick={() => linkedEvent && onEditEvent?.(linkedEvent)}
      className={`w-full rounded-2xl border p-3 text-left transition ${
        isHoliday
          ? 'border-slate-300 bg-slate-100'
          : item.kind === 'course'
            ? 'border-blue-100 bg-blue-50/80 hover:bg-blue-50'
            : `${eventColor} ${onEditEvent ? 'hover:opacity-90' : ''}`
      } ${linkedEvent && onEditEvent ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {item.kind === 'course' ? (
              <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-70" />
            ) : (
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
            )}
            <p className="truncate text-sm font-black">{item.title}</p>
          </div>
          {item.eventType && (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-70">
              {CALENDAR_EVENT_LABELS[item.eventType]}
            </p>
          )}
          {item.meta && (
            <p className="mt-1 text-xs font-semibold opacity-75">{item.meta}</p>
          )}
          {item.description && (
            <p className="mt-2 text-xs leading-relaxed opacity-80">{item.description}</p>
          )}
        </div>
        {(item.startTime || item.endTime) && (
          <div className="flex shrink-0 items-center gap-1 text-[11px] font-bold opacity-70">
            <Clock className="h-3 w-3" />
            {item.startTime}{item.endTime ? `–${item.endTime}` : ''}
          </div>
        )}
      </div>
    </button>
  )
}

export function TimetableDayDetailPanel({
  dateKey,
  slots,
  events,
  filterClassId,
  filterTeacherId,
  canManage,
  canAddEvents = canManage,
  onClose,
  onAddEvent,
  onEditEvent,
}: TimetableDayDetailPanelProps) {
  const items = buildDaySchedule(dateKey, slots, events, {
    classId: filterClassId,
    teacherId: filterTeacherId,
  })
  const isHoliday = items.some(item => item.kind === 'holiday')

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Détail du jour</p>
          <h3 className="mt-1 text-lg font-black capitalize text-slate-950">{formatDisplayDate(dateKey)}</h3>
          {isHoliday && (
            <p className="mt-1 text-sm font-semibold text-slate-600">Jour férié ou sans cours</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Aucun cours ni événement prévu ce jour.
          </div>
        ) : (
          items.map(item => (
            <ScheduleItemRow
              key={`${item.kind}-${item.id}`}
              item={item}
              events={events}
              onEditEvent={canManage ? onEditEvent : undefined}
            />
          ))
        )}
      </div>

      {canAddEvents && onAddEvent && (
        <button
          type="button"
          onClick={onAddEvent}
          className="mt-4 w-full rounded-2xl border border-dashed border-[#1B3A6B]/30 py-3 text-sm font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B]/5"
        >
          + Ajouter un événement ce jour
        </button>
      )}
    </div>
  )
}
