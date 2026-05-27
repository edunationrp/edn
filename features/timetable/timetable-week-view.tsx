'use client'

import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TimetableBreaksDialog } from '@/features/timetable/timetable-breaks-dialog'
import { TimetableCalendarView } from '@/features/timetable/timetable-calendar-view'
import { TimetableMobileSchedule } from '@/features/timetable/timetable-mobile-schedule'
import { TimetableRequestsPanel } from '@/features/timetable/timetable-requests-panel'
import { TimetableSlotDialog, type SlotDialogMode } from '@/features/timetable/timetable-slot-dialog'
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { notify } from '@/lib/feedback/toast'
import { buildGridTimeRows, detectTimetableConflicts } from '@/lib/timetable/grid-utils'
import type {
  CalendarEventView,
  TimetableBreakView,
  TimetableChangeRequestView,
  TimetableClassOption,
  TimetableConflict,
  TimetablePageMeta,
  TimetableSlotView,
  TimetableStaffAssignment,
  TimetableTeacherOption,
} from '@/lib/timetable/types'
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Coffee,
  Download,
  Dumbbell,
  FilePenLine,
  FlaskConical,
  Languages,
  Leaf,
  Monitor,
  MoreHorizontal,
  Move,
  Plus,
  Printer,
  School,
  Settings2,
  ShieldCheck,
  User,
  Utensils,
} from 'lucide-react'

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

function uniqueLegend(slots: TimetableSlotView[]) {
  const seen = new Set<string>()
  const items = []
  for (const slot of slots) {
    const style = getSubjectStyle(slot.subjectName)
    if (seen.has(style.label)) continue
    seen.add(style.label)
    items.push(style)
  }
  return items.length > 0 ? items : SUBJECT_STYLES.slice(0, 6)
}

function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 7 : jsDay
}

type MainTab = 'schedule' | 'calendar' | 'secondary'
type ScheduleView = 'class' | 'teacher'

type TimetableWeekViewProps = {
  schoolSlots: TimetableSlotView[]
  teacherSlots: TimetableSlotView[]
  requests: TimetableChangeRequestView[]
  classes: TimetableClassOption[]
  staffAssignments: TimetableStaffAssignment[]
  breaks: TimetableBreakView[]
  calendarEvents: CalendarEventView[]
  teachers: TimetableTeacherOption[]
  meta: TimetablePageMeta
  canManage: boolean
  canRequestChanges: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function TimetableWeekView({
  schoolSlots,
  teacherSlots,
  requests,
  classes,
  staffAssignments,
  breaks,
  calendarEvents,
  teachers,
  meta,
  canManage,
  canRequestChanges,
  emptyTitle = 'Aucun créneau planifié',
  emptyDescription = 'L’emploi du temps officiel apparaîtra ici une fois publié par le censeur.',
}: TimetableWeekViewProps) {
  const printRef = useRef<HTMLElement>(null)
  const [mainTab, setMainTab] = useState<MainTab>('schedule')
  const [scheduleView, setScheduleView] = useState<ScheduleView>('class')
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '')
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id ?? '')
  const [visibleDays, setVisibleDays] = useState<number[]>([...WEEKDAY_NUMBERS])
  const [breaksDialogOpen, setBreaksDialogOpen] = useState(false)
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([])
  const [conflictsChecked, setConflictsChecked] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<SlotDialogMode>('add')
  const [dialogSlot, setDialogSlot] = useState<TimetableSlotView | null>(null)
  const [dialogDefaults, setDialogDefaults] = useState({ day: 1, start: '08:00', end: '09:00' })
  const [mobileSelectedDay, setMobileSelectedDay] = useState<number>(() => {
    const today = getTodayDayOfWeek()
    return today >= 1 && today <= 6 ? today : 1
  })

  const selectedClass = classes.find(item => item.id === selectedClassId)
  const selectedTeacher = teachers.find(item => item.id === selectedTeacherId)
  const pendingRequests = requests.filter(request => request.status === 'pending').length

  const scheduleSlots = useMemo(() => {
    if (canManage && scheduleView === 'class' && selectedClassId) {
      return schoolSlots.filter(slot => slot.classId === selectedClassId)
    }
    if (canManage && scheduleView === 'teacher' && selectedTeacherId) {
      return schoolSlots.filter(slot => slot.teacherId === selectedTeacherId)
    }
    if (canRequestChanges && mainTab === 'secondary') {
      return teacherSlots
    }
    return schoolSlots
  }, [canManage, scheduleView, selectedClassId, selectedTeacherId, schoolSlots, canRequestChanges, mainTab, teacherSlots])

  const displayTimeRows = useMemo(
    () => buildGridTimeRows(breaks, scheduleSlots),
    [breaks, scheduleSlots],
  )

  const legendItems = useMemo(() => uniqueLegend(scheduleSlots), [scheduleSlots])
  const totalHours = scheduleSlots.reduce((sum, slot) => {
    const [startHour, startMinute] = slot.startTime.split(':').map(Number)
    const [endHour, endMinute] = slot.endTime.split(':').map(Number)
    return sum + Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60)
  }, 0)

  const conflictSlotIds = useMemo(() => {
    const ids = new Set<string>()
    for (const conflict of conflicts) {
      for (const id of conflict.slotIds) ids.add(id)
    }
    return ids
  }, [conflicts])

  const slotsByCell = useMemo(() => {
    const grouped = new Map<string, TimetableSlotView[]>()
    for (const slot of scheduleSlots) {
      const key = `${slot.dayOfWeek}:${slot.startTime}`
      grouped.set(key, [...(grouped.get(key) ?? []), slot])
    }
    return grouped
  }, [scheduleSlots])

  const teacherSlotIds = useMemo(
    () => new Set(teacherSlots.map(slot => slot.id)),
    [teacherSlots],
  )

  function openDialog(mode: SlotDialogMode, slot?: TimetableSlotView, defaults?: { day: number; start: string; end: string }) {
    setDialogMode(mode)
    setDialogSlot(slot ?? null)
    setDialogDefaults(defaults ?? { day: 1, start: '08:00', end: '09:00' })
    setDialogOpen(true)
  }

  function handleAddDay() {
    if (visibleDays.includes(7)) {
      notify.info('Tous les jours sont déjà affichés.')
      return
    }
    setVisibleDays(days => [...days, 7])
    notify.success('Dimanche ajouté au planning')
  }

  function handlePrint() {
    window.print()
  }

  function handleExportPdf() {
    notify.info('Export PDF — utilisez Imprimer puis « Enregistrer en PDF ».')
    window.print()
  }

  function handleCheckConflicts() {
    const scope = canManage && scheduleView === 'class' && selectedClassId
      ? schoolSlots.filter(slot => slot.classId === selectedClassId)
      : canManage && scheduleView === 'teacher' && selectedTeacherId
        ? schoolSlots.filter(slot => slot.teacherId === selectedTeacherId)
        : schoolSlots

    const found = detectTimetableConflicts(scope)
    setConflicts(found)
    setConflictsChecked(true)
    if (found.length === 0) {
      notify.success('Aucun conflit détecté sur ce planning.')
    } else {
      notify.error(`${found.length} conflit(s) détecté(s).`)
    }
  }

  function handleSlotClick(slot: TimetableSlotView) {
    if (canManage && scheduleView === 'class') {
      openDialog('edit', slot)
      return
    }
    if (canRequestChanges && teacherSlots.some(item => item.id === slot.id)) {
      openDialog('request', slot)
    }
  }

  const secondaryTabLabel = canManage ? 'Demandes de modification' : 'Mon emploi du temps'
  const pageSubtitle = canManage
    ? 'Gérez l\'emploi du temps, le calendrier scolaire et validez les demandes des professeurs.'
    : 'Consultez l\'emploi du temps de l\'établissement, le calendrier et votre planning personnel.'

  const calendarFilterClassId = canManage && scheduleView === 'class' ? selectedClassId : undefined
  const calendarFilterTeacherId = canManage && scheduleView === 'teacher' ? selectedTeacherId : undefined

  return (
    <section ref={printRef} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:space-y-5 sm:rounded-[2rem] sm:p-4 md:p-6 print:border-0 print:p-0 print:shadow-none">
      <div className="flex flex-col gap-4 sm:gap-5 print:hidden">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1B3A6B]/10 bg-[#1B3A6B]/5 px-3 py-1 text-xs font-semibold text-[#1B3A6B]">
              <Calendar className="h-3.5 w-3.5" />
              {canManage ? 'Gestion du planning' : 'Planning officiel'}
            </div>
            <h1 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:mt-3 sm:text-2xl md:text-3xl">
              Emploi du temps
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{pageSubtitle}</p>
          </div>

          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
            <div className="flex min-w-min rounded-2xl border border-slate-100 bg-slate-50 p-1 text-xs font-semibold sm:text-sm">
              <button
                type="button"
                onClick={() => setMainTab('schedule')}
                className={`shrink-0 rounded-xl px-3 py-2 transition sm:px-4 ${mainTab === 'schedule' ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {canManage ? 'Grille' : 'Établissement'}
              </button>
              <button
                type="button"
                onClick={() => setMainTab('calendar')}
                className={`shrink-0 rounded-xl px-3 py-2 transition sm:px-4 ${mainTab === 'calendar' ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                Calendrier
              </button>
              <button
                type="button"
                onClick={() => setMainTab('secondary')}
                className={`relative shrink-0 rounded-xl px-3 py-2 transition sm:px-4 ${mainTab === 'secondary' ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <span className="sm:hidden">{canManage ? 'Demandes' : 'Mon EDT'}</span>
                <span className="hidden sm:inline">{secondaryTabLabel}</span>
                {canManage && pendingRequests > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">
                    {pendingRequests}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {(mainTab === 'schedule' || mainTab === 'calendar') && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Année scolaire</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{meta.schoolYearName}</p>
              </div>

              {canManage ? (
                <>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Vue</p>
                    <select
                      value={scheduleView}
                      onChange={event => setScheduleView(event.target.value as ScheduleView)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm"
                    >
                      <option value="class">Par classe</option>
                      <option value="teacher">Par professeur</option>
                    </select>
                  </div>
                  {scheduleView === 'class' ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <label htmlFor="timetable-class" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Classe
                      </label>
                      <select
                        id="timetable-class"
                        value={selectedClassId}
                        onChange={event => {
                          setSelectedClassId(event.target.value)
                          setConflictsChecked(false)
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm"
                      >
                        {classes.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <label htmlFor="timetable-teacher" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Professeur
                      </label>
                      <select
                        id="timetable-teacher"
                        value={selectedTeacherId}
                        onChange={event => {
                          setSelectedTeacherId(event.target.value)
                          setConflictsChecked(false)
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm"
                      >
                        {teachers.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Classe</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">{meta.className}</p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Série / Filière</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{meta.trackName}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Semestre</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{meta.termName}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {scheduleView === 'teacher' ? 'Professeur' : 'Professeur principal'}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">
                  {scheduleView === 'teacher'
                    ? selectedTeacher?.name ?? '—'
                    : selectedClass?.mainTeacherName ?? meta.mainTeacherName}
                </p>
              </div>
            </div>

            {canManage && mainTab === 'schedule' && (
              <div className="flex flex-wrap gap-2">
                {scheduleView === 'class' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="navy"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      if (!selectedClassId) {
                        notify.error('Sélectionnez d\'abord une classe.')
                        return
                      }
                      openDialog('add')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter une matière</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => setBreaksDialogOpen(true)}>
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurer les pauses</span>
                  <span className="sm:hidden">Pauses</span>
                </Button>
                <Button type="button" size="sm" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none" onClick={handleAddDay}>
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Ajouter une journée</span>
                  <span className="sm:hidden">+ Jour</span>
                </Button>
                <Button type="button" size="sm" variant="outline" className="hidden sm:inline-flex" onClick={() => notify.info('Cliquez sur un créneau pour le modifier ou ajouter une description.')}>
                  <FilePenLine className="h-4 w-4" />
                  Modifier
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={handleExportPdf}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {mainTab === 'calendar' ? (
        <TimetableCalendarView
          slots={schoolSlots}
          events={calendarEvents}
          classes={classes}
          teachers={teachers}
          canManage={canManage}
          canAddEvents={canManage || canRequestChanges}
          filterClassId={calendarFilterClassId}
          filterTeacherId={calendarFilterTeacherId}
        />
      ) : mainTab === 'secondary' && canManage ? (
        <TimetableRequestsPanel requests={requests} canManage={canManage} />
      ) : scheduleSlots.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1B3A6B] shadow-sm">
            {scheduleView === 'teacher' ? <User className="h-6 w-6" /> : <Calendar className="h-6 w-6" />}
          </div>
          <p className="mt-4 text-base font-bold text-slate-900">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
          {canManage && mainTab === 'schedule' && scheduleView === 'class' && (
            <Button type="button" className="mt-4" variant="navy" onClick={() => openDialog('add')}>
              <Plus className="h-4 w-4" />
              Ajouter le premier cours
            </Button>
          )}
        </div>
      ) : (
        <>
          <TimetableMobileSchedule
            visibleDays={visibleDays}
            selectedDay={mobileSelectedDay}
            onSelectDay={setMobileSelectedDay}
            displayTimeRows={displayTimeRows}
            breaks={breaks}
            slotsByCell={slotsByCell}
            conflictSlotIds={conflictSlotIds}
            scheduleView={scheduleView}
            canManage={canManage}
            canRequestChanges={canRequestChanges}
            teacherSlotIds={teacherSlotIds}
            getSubjectStyle={getSubjectStyle}
            onSlotClick={handleSlotClick}
            onAddSlot={(day, start, end) => openDialog('add', undefined, { day, start, end })}
          />

          <div className="hidden overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:block print:block">
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
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-slate-100 bg-white px-4 py-3">
                    <Move className="h-3.5 w-3.5 text-slate-300" />
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
                      <div key={`${row.id}-${day}`} className="min-h-[92px] border-r border-slate-100 bg-slate-50/30 p-2 transition hover:bg-slate-50">
                        {cellSlots.length === 0 ? (
                          <button
                            type="button"
                            className="flex h-full min-h-[74px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-slate-300 transition hover:border-[#1B3A6B]/30 hover:text-[#1B3A6B]"
                            disabled={!canManage || scheduleView !== 'class'}
                            title={canManage && scheduleView === 'class' ? 'Ajouter un cours' : 'Créneau libre'}
                            onClick={() => canManage && scheduleView === 'class' && openDialog('add', undefined, { day, start: row.start!, end: row.end! })}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {cellSlots.map(slot => {
                              const style = getSubjectStyle(slot.subjectName)
                              const Icon = style.icon
                              const isOwnSlot = teacherSlots.some(item => item.id === slot.id)
                              const clickable = (canManage && scheduleView === 'class') || (canRequestChanges && isOwnSlot)
                              const hasConflict = conflictSlotIds.has(slot.id)
                              return (
                                <button
                                  type="button"
                                  key={slot.id}
                                  onClick={() => clickable && handleSlotClick(slot)}
                                  title={
                                    slot.description
                                      ? slot.description
                                      : canManage
                                        ? 'Cliquer pour modifier'
                                        : isOwnSlot
                                          ? 'Demander une modification'
                                          : `${slot.className} · ${slot.teacherName}`
                                  }
                                  className={`group w-full rounded-2xl border p-3 text-left shadow-sm transition duration-200 ${
                                    clickable ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : 'cursor-default'
                                  } ${hasConflict ? 'ring-2 ring-rose-400' : ''} ${style.card}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.color}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                                        <p className="truncate text-xs font-black">{slot.subjectName}</p>
                                        {hasConflict && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
                                      </div>
                                      <p className="mt-1 truncate text-[11px] font-semibold opacity-75">{slot.teacherName}</p>
                                      <p className="truncate text-[11px] opacity-70">
                                        {scheduleView === 'teacher' ? slot.className : slot.className}
                                        {slot.room ? ` · Salle ${slot.room}` : ''}
                                      </p>
                                      {slot.description && (
                                        <p className="mt-1 line-clamp-2 text-[10px] italic opacity-70">{slot.description}</p>
                                      )}
                                    </div>
                                    {clickable && <MoreHorizontal className="h-4 w-4 opacity-30 transition group-hover:opacity-70" />}
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
        </>
      )}

      {mainTab === 'schedule' && scheduleSlots.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:rounded-3xl sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">Légende des matières</p>
              <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                {legendItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4 lg:min-w-[560px]">
              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                <p className="font-bold text-slate-900">{totalHours.toFixed(0)} h</p>
                <p>Total heures</p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                <p className="truncate font-bold text-slate-900">{meta.lastModified}</p>
                <p>Dernière modif.</p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                <p className={`flex items-center gap-1 font-bold ${conflictsChecked && conflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {conflictsChecked && conflicts.length > 0 ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {conflicts.length} conflit(s)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      {conflictsChecked ? 'OK' : '—'}
                    </>
                  )}
                </p>
                <p>Statut</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="col-span-2 h-full sm:col-span-1" onClick={handleCheckConflicts}>
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Vérifier les conflits</span>
                <span className="sm:hidden">Conflits</span>
              </Button>
            </div>
          </div>

          {conflictsChecked && conflicts.length > 0 && (
            <div className="mt-4 space-y-2">
              {conflicts.map(conflict => (
                <div key={conflict.id} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {conflict.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TimetableSlotDialog
        open={dialogOpen}
        mode={dialogMode}
        slot={dialogSlot}
        assignments={staffAssignments}
        selectedClassId={selectedClassId}
        defaultDay={dialogDefaults.day}
        defaultStart={dialogDefaults.start}
        defaultEnd={dialogDefaults.end}
        onClose={() => setDialogOpen(false)}
      />

      <TimetableBreaksDialog
        open={breaksDialogOpen}
        breaks={breaks}
        onClose={() => setBreaksDialogOpen(false)}
      />
    </section>
  )
}
