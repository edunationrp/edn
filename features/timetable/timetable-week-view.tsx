'use client'

import { useMemo, useState, useTransition } from 'react'
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
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { createTimetableChangeRequest, reviewTimetableChangeRequest } from '@/lib/actions/timetable'
import { notify } from '@/lib/feedback/toast'
import type {
  TimetableChangeRequestView,
  TimetablePageMeta,
  TimetableSlotView,
} from '@/lib/timetable/types'
import {
  BookOpen,
  Calculator,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock,
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
  ShieldCheck,
  Utensils,
} from 'lucide-react'

type TimeRow = {
  id: string
  label: string
  start?: string
  end?: string
  kind: 'course' | 'pause' | 'lunch'
}

const DEFAULT_TIME_ROWS: TimeRow[] = [
  { id: '0730', label: '07:30 - 08:30', start: '07:30', end: '08:30', kind: 'course' },
  { id: '0830', label: '08:30 - 09:30', start: '08:30', end: '09:30', kind: 'course' },
  { id: 'pause-am', label: '09:30 - 10:00', kind: 'pause' },
  { id: '1000', label: '10:00 - 11:00', start: '10:00', end: '11:00', kind: 'course' },
  { id: '1100', label: '11:00 - 12:00', start: '11:00', end: '12:00', kind: 'course' },
  { id: 'lunch', label: '12:00 - 13:00', kind: 'lunch' },
  { id: '1300', label: '13:00 - 14:00', start: '13:00', end: '14:00', kind: 'course' },
  { id: '1400', label: '14:00 - 15:00', start: '14:00', end: '15:00', kind: 'course' },
  { id: '1500', label: '15:00 - 16:00', start: '15:00', end: '16:00', kind: 'course' },
]

const SUBJECT_STYLES = [
  {
    match: ['math', 'mathématiques'],
    label: 'Mathématiques',
    color: 'bg-blue-500',
    card: 'border-blue-100 bg-blue-50/90 text-blue-950 shadow-blue-100/60',
    icon: Calculator,
  },
  {
    match: ['français', 'francais'],
    label: 'Français',
    color: 'bg-emerald-500',
    card: 'border-emerald-100 bg-emerald-50/90 text-emerald-950 shadow-emerald-100/60',
    icon: BookOpen,
  },
  {
    match: ['physique', 'chimie'],
    label: 'Physique-Chimie',
    color: 'bg-rose-500',
    card: 'border-rose-100 bg-rose-50/90 text-rose-950 shadow-rose-100/60',
    icon: FlaskConical,
  },
  {
    match: ['informatique', 'numérique'],
    label: 'Informatique',
    color: 'bg-violet-500',
    card: 'border-violet-100 bg-violet-50/90 text-violet-950 shadow-violet-100/60',
    icon: Monitor,
  },
  {
    match: ['histoire', 'géographie', 'geo'],
    label: 'Histoire-Géo',
    color: 'bg-amber-500',
    card: 'border-amber-100 bg-amber-50/90 text-amber-950 shadow-amber-100/60',
    icon: School,
  },
  {
    match: ['svt', 'sciences'],
    label: 'SVT',
    color: 'bg-teal-500',
    card: 'border-teal-100 bg-teal-50/90 text-teal-950 shadow-teal-100/60',
    icon: Leaf,
  },
  {
    match: ['anglais', 'langue'],
    label: 'Anglais',
    color: 'bg-indigo-500',
    card: 'border-indigo-100 bg-indigo-50/90 text-indigo-950 shadow-indigo-100/60',
    icon: Languages,
  },
  {
    match: ['eps', 'sport'],
    label: 'EPS',
    color: 'bg-lime-500',
    card: 'border-lime-100 bg-lime-50/90 text-lime-950 shadow-lime-100/60',
    icon: Dumbbell,
  },
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

function slotKey(day: number, startTime: string, endTime: string) {
  return `${day}:${startTime}:${endTime}`
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

type TimetableWeekViewProps = {
  schoolSlots: TimetableSlotView[]
  teacherSlots: TimetableSlotView[]
  requests: TimetableChangeRequestView[]
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
  meta,
  canManage,
  canRequestChanges,
  emptyTitle = 'Aucun créneau planifié',
  emptyDescription = 'L’emploi du temps officiel apparaîtra ici une fois publié par le censeur.',
}: TimetableWeekViewProps) {
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<'school' | 'teacher'>('school')
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlotView | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [room, setRoom] = useState('')
  const [reason, setReason] = useState('')

  const activeSlots = viewMode === 'teacher' ? teacherSlots : schoolSlots
  const legendItems = useMemo(() => uniqueLegend(activeSlots), [activeSlots])
  const pendingRequests = requests.filter(request => request.status === 'pending').length
  const totalHours = activeSlots.reduce((sum, slot) => {
    const [startHour, startMinute] = slot.startTime.split(':').map(Number)
    const [endHour, endMinute] = slot.endTime.split(':').map(Number)
    return sum + Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60)
  }, 0)

  const slotsByCell = useMemo(() => {
    const grouped = new Map<string, TimetableSlotView[]>()
    for (const slot of activeSlots) {
      const key = slotKey(slot.dayOfWeek, slot.startTime, slot.endTime)
      grouped.set(key, [...(grouped.get(key) ?? []), slot])
    }
    return grouped
  }, [activeSlots])

  function openRequest(slot: TimetableSlotView) {
    setSelectedSlot(slot)
    setDayOfWeek(String(slot.dayOfWeek))
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    setRoom(slot.room ?? '')
    setReason('')
  }

  function submitRequest() {
    if (!selectedSlot) return

    startTransition(async () => {
      const result = await createTimetableChangeRequest(selectedSlot.id, {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || null,
        reason,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Demande envoyée au censeur')
      setSelectedSlot(null)
    })
  }

  function reviewRequest(requestId: string, decision: 'approved' | 'rejected') {
    startTransition(async () => {
      const result = await reviewTimetableChangeRequest(requestId, decision)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success(decision === 'approved' ? 'Demande approuvée' : 'Demande refusée')
    })
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1B3A6B]/10 bg-[#1B3A6B]/5 px-3 py-1 text-xs font-semibold text-[#1B3A6B]">
              <Calendar className="h-3.5 w-3.5" />
              Planning officiel
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Emploi du temps
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Vue globale de l’établissement et planning personnel du professeur.
            </p>
          </div>

          <div className="flex rounded-2xl border border-slate-100 bg-slate-50 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('school')}
              className={`rounded-xl px-4 py-2 transition ${viewMode === 'school' ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Vue établissement
            </button>
            <button
              type="button"
              onClick={() => setViewMode('teacher')}
              className={`rounded-xl px-4 py-2 transition ${viewMode === 'teacher' ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Mon emploi du temps
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Année scolaire', meta.schoolYearName],
            ['Classe', meta.className],
            ['Série / Filière', meta.trackName],
            ['Semestre', meta.termName],
            ['Professeur principal', meta.mainTeacherName],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-slate-900">{value}</p>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="navy" disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Ajouter une matière
          </Button>
          <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-700" disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Ajouter une heure
          </Button>
          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={!canManage}>
            <CalendarPlus className="h-4 w-4" />
            Ajouter une journée
          </Button>
          <Button size="sm" variant="outline" disabled={!canManage && !canRequestChanges}>
            <FilePenLine className="h-4 w-4" />
            {canRequestChanges ? 'Demander une modification' : 'Modifier'}
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4" />
            Exporter PDF
          </Button>
          <Button size="sm" variant="outline">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Plus d’options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeSlots.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1B3A6B] shadow-sm">
            <Calendar className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-bold text-slate-900">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="sticky top-0 z-20 grid grid-cols-[120px_repeat(6,minmax(140px,1fr))] bg-[#102E5C] text-white">
                <div className="sticky left-0 z-30 border-r border-white/15 bg-[#102E5C] px-4 py-4 text-center text-xs font-black">
                  Heures
                </div>
                {WEEKDAY_NUMBERS.map(day => (
                  <div key={day} className="border-r border-white/15 px-4 py-4 text-center text-xs font-black">
                    {DAY_LABELS[day]}
                  </div>
                ))}
              </div>

              {DEFAULT_TIME_ROWS.map(row => (
                <div key={row.id} className="grid grid-cols-[120px_repeat(6,minmax(140px,1fr))] border-b border-slate-100 last:border-b-0">
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-slate-100 bg-white px-4 py-3">
                    <Move className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-black text-slate-800">{row.label}</span>
                  </div>

                  {WEEKDAY_NUMBERS.map(day => {
                    if (row.kind !== 'course') {
                      const Icon = row.kind === 'pause' ? Coffee : Utensils
                      return (
                        <div key={`${row.id}-${day}`} className="border-r border-slate-100 bg-slate-50/70 px-3 py-3">
                          <div className="flex h-full min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white/70 text-xs font-black uppercase tracking-wide text-slate-400">
                            <Icon className="h-4 w-4" />
                            {row.kind === 'pause' ? 'Pause' : 'Déjeuner'}
                          </div>
                        </div>
                      )
                    }

                    const cellSlots = slotsByCell.get(slotKey(day, row.start!, row.end!)) ?? []
                    return (
                      <div
                        key={`${row.id}-${day}`}
                        className="min-h-[92px] border-r border-slate-100 bg-slate-50/30 p-2 transition hover:bg-slate-50"
                      >
                        {cellSlots.length === 0 ? (
                          <button
                            type="button"
                            className="flex h-full min-h-[74px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-slate-300 transition hover:border-[#1B3A6B]/30 hover:text-[#1B3A6B]"
                            disabled={!canManage}
                            title={canManage ? 'Ajouter un cours' : 'Créneau libre'}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {cellSlots.map(slot => {
                              const style = getSubjectStyle(slot.subjectName)
                              const Icon = style.icon
                              const isOwnSlot = teacherSlots.some(item => item.id === slot.id)
                              return (
                                <button
                                  type="button"
                                  draggable
                                  key={slot.id}
                                  onClick={() => canRequestChanges && isOwnSlot && openRequest(slot)}
                                  title={canRequestChanges && isOwnSlot ? 'Demander une modification' : `${slot.className} · ${slot.teacherName}`}
                                  className={`group w-full rounded-2xl border p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.color}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                                        <p className="truncate text-xs font-black">{slot.subjectName}</p>
                                      </div>
                                      <p className="mt-1 truncate text-[11px] font-semibold opacity-75">{slot.teacherName}</p>
                                      <p className="truncate text-[11px] opacity-70">
                                        {slot.className}{slot.room ? ` · Salle ${slot.room}` : ''}
                                      </p>
                                    </div>
                                    <MoreHorizontal className="h-4 w-4 opacity-30 transition group-hover:opacity-70" />
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

      <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Légende des matières</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {legendItems.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-4 xl:min-w-[560px]">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <p className="font-bold text-slate-900">{totalHours.toFixed(0)} h</p>
              <p>Total heures</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <p className="font-bold text-slate-900">{meta.lastModified}</p>
              <p>Dernière modification</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <p className="flex items-center gap-1 font-bold text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Aucun conflit
              </p>
              <p>Statut</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="h-full">
              <CheckCircle2 className="h-4 w-4" />
              Vérifier les conflits
            </Button>
          </div>
        </div>

        {(canRequestChanges || canManage) && (
          <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">Demandes de modification</p>
                <p className="text-xs text-slate-500">
                  {pendingRequests} demande{pendingRequests !== 1 ? 's' : ''} en attente de traitement par le censeur.
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                Validation censeur
              </span>
            </div>
            {requests.length > 0 && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {requests.slice(0, 4).map(request => (
                  <div key={request.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{request.subjectName} · {request.className}</p>
                        <p className="mt-0.5 text-slate-500">
                          Souhaité : {DAY_LABELS[request.requestedDayOfWeek]} {request.requestedStartTime} - {request.requestedEndTime}
                        </p>
                        <p className="mt-1 line-clamp-2 text-slate-400">{request.reason}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 font-bold ${
                        request.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : request.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}>
                        {request.status === 'pending' ? 'En attente' : request.status === 'approved' ? 'Approuvée' : 'Refusée'}
                      </span>
                    </div>
                    {canManage && request.status === 'pending' && (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => reviewRequest(request.id, 'rejected')}
                          disabled={isPending}
                        >
                          Refuser
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => reviewRequest(request.id, 'approved')}
                          disabled={isPending}
                        >
                          Approuver
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedSlot)} onOpenChange={open => !open && setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une modification</DialogTitle>
            <DialogDescription>
              Votre demande sera envoyée au censeur. L’emploi du temps officiel ne change qu’après validation.
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
                <p className="font-bold text-slate-900">{selectedSlot.subjectName}</p>
                <p className="text-slate-500">{selectedSlot.className} · {selectedSlot.startTime} - {selectedSlot.endTime}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Jour</label>
                  <select
                    value={dayOfWeek}
                    onChange={event => setDayOfWeek(event.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
                  >
                    {WEEKDAY_NUMBERS.map(day => (
                      <option key={day} value={day}>{DAY_LABELS[day]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Début</label>
                  <Input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Fin</label>
                  <Input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Salle souhaitée</label>
                <Input value={room} onChange={event => setRoom(event.target.value)} placeholder="Salle A2" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Motif</label>
                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  placeholder="Expliquez brièvement la contrainte ou le besoin de changement."
                  className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-[#7AB832]/50 focus:ring-2 focus:ring-[#7AB832]/20"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedSlot(null)}>
              Annuler
            </Button>
            <Button type="button" variant="navy" onClick={submitRequest} disabled={isPending}>
              <Clock className="h-4 w-4" />
              Envoyer au censeur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
