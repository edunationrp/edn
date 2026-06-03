'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { StudentTimetableDaySchedule } from '@/features/eleve/student-timetable-day-schedule'
import { StudentTimetablePdfExport } from '@/features/eleve/student-timetable-pdf-export'
import { StudentTimetableTodayPanel } from '@/features/eleve/student-timetable-today-panel'
import {
  StudentTimetableToolbar,
  type TimetableViewMode,
} from '@/features/eleve/student-timetable-toolbar'
import { TimetablePrintSheet } from '@/features/timetable/timetable-print-sheet'
import { Button } from '@/components/ui/button'
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { coursResourcesHref } from '@/lib/timetable/course-links'
import { formatTimetableRoom } from '@/lib/timetable/display'
import { buildGridTimeRows, groupSlotsByGridCell } from '@/lib/timetable/grid-utils'
import {
  filterSlotsBySubject,
  getSchoolDayOfWeek,
  listSubjectFilterOptions,
} from '@/lib/timetable/student-timetable-helpers'
import { cn } from '@/lib/utils'
import type { TimetableBreakView, TimetablePageMeta, TimetableSlotView } from '@/lib/timetable/types'
import { notify } from '@/lib/feedback/toast'
import {
  BookOpen,
  Calculator,
  Clock,
  Coffee,
  Dumbbell,
  GraduationCap,
  FlaskConical,
  Languages,
  Leaf,
  MapPin,
  Monitor,
  Printer,
  School,
  User,
  Utensils,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'

type StudentTimetableViewProps = {
  className: string
  studentName?: string
  schoolYearName?: string | null
  slots: TimetableSlotView[]
  breaks: TimetableBreakView[]
  schoolName: string
  schoolLogoUrl?: string | null
  schoolWatermarkOpacity?: number | null
  meta: TimetablePageMeta
}

type SubjectStyle = {
  match: string[]
  label: string
  color: string
  borderAccent: string
  icon: ComponentType<{ className?: string }>
}

const SUBJECT_STYLES: SubjectStyle[] = [
  { match: ['math', 'mathématiques'], label: 'Mathématiques', color: 'bg-blue-500', borderAccent: 'border-l-blue-500', icon: Calculator },
  { match: ['français', 'francais'], label: 'Français', color: 'bg-emerald-500', borderAccent: 'border-l-emerald-500', icon: BookOpen },
  { match: ['physique', 'chimie'], label: 'Physique-Chimie', color: 'bg-rose-500', borderAccent: 'border-l-rose-500', icon: FlaskConical },
  { match: ['informatique', 'numérique'], label: 'Informatique', color: 'bg-violet-500', borderAccent: 'border-l-violet-500', icon: Monitor },
  { match: ['histoire', 'géographie', 'geo'], label: 'Histoire-Géo', color: 'bg-amber-500', borderAccent: 'border-l-amber-500', icon: School },
  { match: ['svt', 'sciences'], label: 'SVT', color: 'bg-teal-500', borderAccent: 'border-l-teal-500', icon: Leaf },
  { match: ['anglais', 'langue'], label: 'Anglais', color: 'bg-indigo-500', borderAccent: 'border-l-indigo-500', icon: Languages },
  { match: ['eps', 'sport'], label: 'EPS', color: 'bg-lime-600', borderAccent: 'border-l-lime-600', icon: Dumbbell },
]

const FALLBACK_STYLE: SubjectStyle = {
  match: [],
  label: 'Autres',
  color: 'bg-slate-400',
  borderAccent: 'border-l-slate-400',
  icon: BookOpen,
}

function getSubjectStyle(subject: string) {
  const normalized = subject.toLowerCase()
  return SUBJECT_STYLES.find(style => style.match.some(key => normalized.includes(key))) ?? FALLBACK_STYLE
}

function slotCardClass(style: SubjectStyle) {
  return `group w-full rounded-xl border border-slate-200 border-l-4 bg-white p-3 text-left shadow-sm transition hover:shadow-md cursor-pointer ${style.borderAccent}`
}

function getInitialDay(): number {
  const day = getSchoolDayOfWeek()
  return day >= 1 && day <= 6 ? day : 1
}

function uniqueLegend(slots: TimetableSlotView[]) {
  const seen = new Set<string>()
  const items: SubjectStyle[] = []
  for (const slot of slots) {
    const style = getSubjectStyle(slot.subjectName)
    if (seen.has(style.label)) continue
    seen.add(style.label)
    items.push(style)
  }
  return items
}

function TimetableSubjectLegend({ items }: { items: SubjectStyle[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Légende</span>
      {items.map(item => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function SlotDetailDialog({
  slot,
  onClose,
}: {
  slot: TimetableSlotView
  onClose: () => void
}) {
  const roomLabel = formatTimetableRoom(slot.room)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[100vw] rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {DAY_LABELS[slot.dayOfWeek]}
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">{slot.subjectName}</h2>
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
          {roomLabel && (
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              {roomLabel}
            </div>
          )}
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
            <p className="mt-1 leading-relaxed text-slate-700">
              {slot.description?.trim() || 'Aucune description pour ce créneau.'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full gap-2 sm:w-auto">
            <Link href={coursResourcesHref(slot.subjectName)} onClick={onClose}>
              <GraduationCap className="h-4 w-4" />
              Ressources de la matière
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function StudentTimetableView({
  className,
  studentName = 'Élève',
  schoolYearName,
  slots,
  breaks,
  schoolName,
  schoolLogoUrl,
  schoolWatermarkOpacity,
  meta,
}: StudentTimetableViewProps) {
  const printRef = useRef<HTMLElement>(null)
  const [selectedDay, setSelectedDay] = useState<number>(getInitialDay)
  const [detailSlot, setDetailSlot] = useState<TimetableSlotView | null>(null)
  const [viewMode, setViewMode] = useState<TimetableViewMode>('week')
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)

  const todayDay = getSchoolDayOfWeek()
  const visibleDays = useMemo(() => [...WEEKDAY_NUMBERS], [])
  const subjectOptions = useMemo(() => listSubjectFilterOptions(slots), [slots])

  const filteredSlots = useMemo(
    () => filterSlotsBySubject(slots, subjectFilter),
    [slots, subjectFilter],
  )

  const displayTimeRows = useMemo(
    () => buildGridTimeRows(breaks, slots),
    [breaks, slots],
  )

  const legendItems = useMemo(() => uniqueLegend(filteredSlots), [filteredSlots])
  const printSubtitle = `Classe : ${className}`

  function goToToday() {
    setViewMode('day')
    setSelectedDay(todayDay >= 1 && todayDay <= 6 ? todayDay : 1)
  }

  function handlePrint() {
    if (slots.length === 0) {
      notify.error('Aucun créneau à imprimer.')
      return
    }
    window.print()
  }

  const slotsByCell = useMemo(
    () => groupSlotsByGridCell(filteredSlots, displayTimeRows),
    [filteredSlots, displayTimeRows],
  )

  const printSlotsByCell = useMemo(
    () => groupSlotsByGridCell(slots, displayTimeRows),
    [slots, displayTimeRows],
  )

  const getSubjectStyleFn = (subject: string) => {
    const style = getSubjectStyle(subject)
    return {
      label: style.label,
      color: style.color,
      card: slotCardClass(style),
      icon: style.icon,
    }
  }

  return (
    <section ref={printRef} className="timetable-print-root w-full min-w-0 space-y-4">
      {slots.length > 0 && (
        <>
          <div className="timetable-print-screen-only">
            <StudentTimetableTodayPanel
              slots={filteredSlots}
              onSelectSlot={setDetailSlot}
              onGoToToday={goToToday}
            />
          </div>

          <div className="timetable-print-screen-only">
            <StudentTimetableToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              subjects={subjectOptions}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={setSubjectFilter}
              filteredCount={filteredSlots.length}
              totalCount={slots.length}
            />
          </div>

          <div className="timetable-print-screen-only flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 sm:w-auto"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 shrink-0" />
              Imprimer
            </Button>
            <StudentTimetablePdfExport
              slots={slots}
              displayTimeRows={displayTimeRows}
              breaks={breaks}
              studentName={studentName}
              schoolName={schoolName}
              className={className}
              schoolYearName={schoolYearName ?? meta.schoolYearName}
              schoolLogoUrl={schoolLogoUrl}
              buttonClassName="w-full sm:w-auto"
            />
          </div>
        </>
      )}

      {filteredSlots.length === 0 && slots.length > 0 && (
        <div className="timetable-print-screen-only rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Aucun créneau pour cette matière. Choisis une autre filière ou affiche toutes les matières.
        </div>
      )}

      {filteredSlots.length > 0 && (
      <div
        className={cn(
          'timetable-print-screen-only',
          viewMode === 'week' && 'md:hidden',
        )}
      >
        <StudentTimetableDaySchedule
          visibleDays={visibleDays}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          displayTimeRows={displayTimeRows}
          breaks={breaks}
          slotsByCell={slotsByCell}
          getSubjectStyle={getSubjectStyleFn}
          onSlotClick={slot => setDetailSlot(slot)}
        />
      </div>
      )}

      {filteredSlots.length > 0 && viewMode === 'week' && (
      <div className="timetable-print-screen-only hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <p className="hidden border-b border-slate-100 bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-500 md:block xl:hidden">
          ← Faites glisser pour voir tous les jours →
        </p>
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="w-max min-w-[720px] sm:min-w-[800px]">
            <div
              className="sticky top-0 z-20 grid bg-[#1B3A6B] text-white"
              style={{ gridTemplateColumns: `108px repeat(${visibleDays.length}, minmax(128px, 1fr))` }}
            >
              <div className="sticky left-0 z-30 border-r border-white/15 bg-[#1B3A6B] px-3 py-3.5 text-center text-xs font-bold">
                Heures
              </div>
              {visibleDays.map(day => (
                <div
                  key={day}
                  className={cn(
                    'border-r border-white/15 px-3 py-3.5 text-center text-xs font-bold',
                    day === todayDay && 'bg-[#7AB832]/25',
                  )}
                >
                  {DAY_LABELS[day]}
                  {day === todayDay && (
                    <span className="mt-0.5 block text-[9px] font-semibold text-[#7AB832]">
                      Auj.
                    </span>
                  )}
                </div>
              ))}
            </div>

            {displayTimeRows.map(row => (
              <div
                key={row.id}
                className="grid border-b border-slate-100 last:border-b-0"
                style={{ gridTemplateColumns: `108px repeat(${visibleDays.length}, minmax(128px, 1fr))` }}
              >
                <div className="sticky left-0 z-10 flex items-center border-r border-slate-100 bg-slate-50 px-3 py-3">
                  <span className="text-xs font-semibold tabular-nums text-slate-700">{row.label}</span>
                </div>

                {visibleDays.map(day => {
                  if (row.kind !== 'course') {
                    const breakItem = breaks.find(item => item.id === row.id)
                    const label = breakItem?.label ?? (row.kind === 'pause' ? 'Pause' : 'Déjeuner')
                    const Icon = row.kind === 'pause' ? Coffee : Utensils
                    return (
                      <div key={`${row.id}-${day}`} className="border-r border-slate-100 bg-amber-50/40 px-2 py-2">
                        <div className="flex h-full min-h-[52px] items-center justify-center gap-1.5 rounded-lg border border-amber-100/80 bg-white/80 px-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800/80">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{label}</span>
                        </div>
                      </div>
                    )
                  }

                  const cellSlots = slotsByCell.get(`${day}:${row.start!}`) ?? []
                  return (
                    <div
                      key={`${row.id}-${day}`}
                      className={cn(
                        'min-h-[88px] border-r border-slate-100 bg-slate-50/20 p-1.5',
                        day === todayDay && 'bg-[#7AB832]/[0.04]',
                      )}
                    >
                      {cellSlots.length === 0 ? (
                        <div className="flex h-full min-h-[72px] w-full items-center justify-center rounded-lg text-[11px] text-slate-300">
                          —
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {cellSlots.map(slot => {
                            const style = getSubjectStyle(slot.subjectName)
                            const Icon = style.icon
                            const roomLabel = formatTimetableRoom(slot.room)
                            return (
                              <button
                                type="button"
                                key={slot.id}
                                onClick={() => setDetailSlot(slot)}
                                title={slot.description ?? slot.subjectName}
                                className={slotCardClass(style)}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.color}`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-1">
                                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                                      <p className="text-xs font-bold leading-snug text-gray-900">
                                        {slot.subjectName}
                                      </p>
                                    </div>
                                    <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                                      {slot.teacherName}
                                    </p>
                                    {roomLabel && (
                                      <p className="text-[10px] text-slate-500">{roomLabel}</p>
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
      )}

      <div className="timetable-print-screen-only">
        <TimetableSubjectLegend items={legendItems} />
      </div>

      {detailSlot && (
        <SlotDetailDialog slot={detailSlot} onClose={() => setDetailSlot(null)} />
      )}

      {slots.length > 0 && (
        <TimetablePrintSheet
          schoolName={schoolName}
          logoUrl={schoolLogoUrl}
          watermarkOpacity={schoolWatermarkOpacity}
          meta={meta}
          subtitle={printSubtitle}
          visibleDays={visibleDays}
          displayTimeRows={displayTimeRows}
          breaks={breaks}
          slotsByCell={printSlotsByCell}
          legendItems={uniqueLegend(slots).map(item => ({
            label: item.label,
            color: item.color,
          }))}
        />
      )}
    </section>
  )
}
