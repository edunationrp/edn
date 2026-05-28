'use client'

import { useMemo, useState } from 'react'
import { TimetableMobileSchedule } from '@/features/timetable/timetable-mobile-schedule'
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { buildGridTimeRows } from '@/lib/timetable/grid-utils'
import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'
import {
  BookOpen,
  Calculator,
  Clock,
  Coffee,
  Dumbbell,
  FlaskConical,
  Languages,
  Leaf,
  MapPin,
  Monitor,
  School,
  User,
  Utensils,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'

type StudentTimetableViewProps = {
  className: string
  slots: TimetableSlotView[]
  breaks: TimetableBreakView[]
}

const SUBJECT_STYLES = [
  { match: ['math', 'mathématiques'], label: 'Mathématiques', color: 'bg-blue-500', card: 'border-blue-100 bg-blue-50/90 text-blue-950 shadow-blue-100/60', icon: Calculator },
  { match: ['français', 'francais'], label: 'Français', color: 'bg-emerald-500', card: 'border-emerald-100 bg-emerald-50/90 text-emerald-950 shadow-emerald-100/60', icon: BookOpen },
  { match: ['physique', 'chimie'], label: 'Physique-Chimie', color: 'bg-rose-500', card: 'border-rose-100 bg-rose-50/90 text-rose-950 shadow-rose-100/60', icon: FlaskConical },
  { match: ['informatique', 'numérique'], label: 'Informatique', color: 'bg-violet-500', card: 'border-violet-100 bg-violet-50/90 text-violet-950 shadow-violet-100/60', icon: Monitor },
  { match: ['histoire', 'géographie', 'geo'], label: 'Histoire-Géo', color: 'bg-amber-500', card: 'border-amber-100 bg-amber-50/90 text-amber-950 shadow-amber-100/60', icon: School },
  { match: ['svt', 'sciences'], label: 'SVT', color: 'bg-teal-500', card: 'border-teal-100 bg-teal-50/90 text-teal-950 shadow-teal-100/60', icon: Leaf },
  { match: ['anglais', 'langue'], label: 'Anglais', color: 'bg-indigo-500', card: 'border-indigo-100 bg-indigo-50/90 text-indigo-950 shadow-indigo-100/60', icon: Languages },
  { match: ['eps', 'sport'], label: 'EPS', color: 'bg-lime-500', card: 'border-lime-100 bg-lime-50/90 text-lime-950 shadow-lime-100/60', icon: Dumbbell },
]

const FALLBACK_STYLE = {
  label: 'Autres',
  color: 'bg-slate-400',
  card: 'border-slate-100 bg-slate-50/90 text-slate-950 shadow-slate-100/60',
  icon: BookOpen,
}

function getSubjectStyle(subject: string) {
  const normalized = subject.toLowerCase()
  return SUBJECT_STYLES.find(style => style.match.some(key => normalized.includes(key))) ?? FALLBACK_STYLE
}

function getInitialDay(): number {
  const today = new Date().getDay()
  const day = today === 0 ? 7 : today
  return day >= 1 && day <= 6 ? day : 1
}

function SlotDetailDialog({
  slot,
  onClose,
}: {
  slot: TimetableSlotView
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {DAY_LABELS[slot.dayOfWeek]}
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">{slot.subjectName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            {slot.startTime} – {slot.endTime}
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            {slot.teacherName}
          </div>
          {slot.room && (
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              Salle {slot.room}
            </div>
          )}
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
            <p className="mt-1 leading-relaxed text-slate-700">
              {slot.description?.trim() || 'Aucune description pour ce créneau.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StudentTimetableView({ className, slots, breaks }: StudentTimetableViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(getInitialDay)
  const [detailSlot, setDetailSlot] = useState<TimetableSlotView | null>(null)

  const visibleDays = useMemo(() => [...WEEKDAY_NUMBERS], [])

  const displayTimeRows = useMemo(
    () => buildGridTimeRows(breaks, slots),
    [breaks, slots],
  )

  const slotsByCell = useMemo(() => {
    const grouped = new Map<string, TimetableSlotView[]>()
    for (const slot of slots) {
      const key = `${slot.dayOfWeek}:${slot.startTime}`
      grouped.set(key, [...(grouped.get(key) ?? []), slot])
    }
    return grouped
  }, [slots])

  const getSubjectStyleFn = (subject: string) => getSubjectStyle(subject) as {
    label: string
    color: string
    card: string
    icon: ComponentType<{ className?: string }>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Emploi du temps de <span className="font-semibold text-gray-800">{className}</span>
        {' '}— consultation seule. Cliquez sur un cours pour voir le détail du jour.
      </p>

      <TimetableMobileSchedule
        visibleDays={visibleDays}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        displayTimeRows={displayTimeRows}
        breaks={breaks}
        slotsByCell={slotsByCell}
        conflictSlotIds={new Set()}
        scheduleView="class"
        canManage={false}
        canRequestChanges={false}
        viewOnly
        teacherSlotIds={new Set()}
        getSubjectStyle={getSubjectStyleFn}
        onSlotClick={slot => setDetailSlot(slot)}
        onAddSlot={() => {}}
      />

      <div className="hidden overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="min-w-[980px]">
            <div
              className="sticky top-0 z-20 grid bg-[#102E5C] text-white"
              style={{ gridTemplateColumns: `120px repeat(${visibleDays.length}, minmax(140px, 1fr))` }}
            >
              <div className="sticky left-0 z-30 border-r border-white/15 bg-[#102E5C] px-4 py-4 text-center text-xs font-black">
                Heures
              </div>
              {visibleDays.map(day => (
                <div key={day} className="border-r border-white/15 px-4 py-4 text-center text-xs font-black">
                  {DAY_LABELS[day]}
                </div>
              ))}
            </div>

            {displayTimeRows.map(row => (
              <div
                key={row.id}
                className="grid border-b border-slate-100 last:border-b-0"
                style={{ gridTemplateColumns: `120px repeat(${visibleDays.length}, minmax(140px, 1fr))` }}
              >
                <div className="sticky left-0 z-10 flex items-center border-r border-slate-100 bg-white px-4 py-3">
                  <span className="text-xs font-black text-slate-800">{row.label}</span>
                </div>

                {visibleDays.map(day => {
                  if (row.kind !== 'course') {
                    const breakItem = breaks.find(item => item.id === row.id)
                    const label = breakItem?.label ?? (row.kind === 'pause' ? 'Pause' : 'Déjeuner')
                    const Icon = row.kind === 'pause' ? Coffee : Utensils
                    return (
                      <div key={`${row.id}-${day}`} className="border-r border-slate-100 bg-slate-50/70 px-3 py-3">
                        <div className="flex h-full min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white/70 text-xs font-black uppercase tracking-wide text-slate-400">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </div>
                    )
                  }

                  const cellSlots = slotsByCell.get(`${day}:${row.start!}`) ?? []
                  return (
                    <div key={`${row.id}-${day}`} className="min-h-[92px] border-r border-slate-100 bg-slate-50/30 p-2">
                      {cellSlots.length === 0 ? (
                        <div className="flex h-full min-h-[74px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                          Libre
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cellSlots.map(slot => {
                            const style = getSubjectStyle(slot.subjectName)
                            const Icon = style.icon
                            return (
                              <button
                                type="button"
                                key={slot.id}
                                onClick={() => setDetailSlot(slot)}
                                title={slot.description ?? slot.subjectName}
                                className={`group w-full rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${style.card}`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.color}`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                                      <p className="truncate text-xs font-black">{slot.subjectName}</p>
                                    </div>
                                    <p className="mt-1 truncate text-[11px] font-semibold opacity-75">{slot.teacherName}</p>
                                    {slot.room && (
                                      <p className="truncate text-[11px] opacity-70">Salle {slot.room}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {detailSlot && (
        <SlotDetailDialog slot={detailSlot} onClose={() => setDetailSlot(null)} />
      )}
    </div>
  )
}
