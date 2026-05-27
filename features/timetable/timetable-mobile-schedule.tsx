'use client'

import type { ComponentType } from 'react'
import { DAY_LABELS } from '@/lib/timetable/constants'
import type { GridTimeRow } from '@/lib/timetable/grid-utils'
import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'
import {
  AlertTriangle,
  Coffee,
  MoreHorizontal,
  Plus,
  Utensils,
} from 'lucide-react'

type SubjectStyle = {
  label: string
  color: string
  card: string
  icon: ComponentType<{ className?: string }>
}

type TimetableMobileScheduleProps = {
  visibleDays: number[]
  selectedDay: number
  onSelectDay: (day: number) => void
  displayTimeRows: GridTimeRow[]
  breaks: TimetableBreakView[]
  slotsByCell: Map<string, TimetableSlotView[]>
  conflictSlotIds: Set<string>
  scheduleView: 'class' | 'teacher'
  canManage: boolean
  canRequestChanges: boolean
  teacherSlotIds: Set<string>
  getSubjectStyle: (subject: string) => SubjectStyle
  onSlotClick: (slot: TimetableSlotView) => void
  onAddSlot: (day: number, start: string, end: string) => void
}

export function TimetableMobileSchedule({
  visibleDays,
  selectedDay,
  onSelectDay,
  displayTimeRows,
  breaks,
  slotsByCell,
  conflictSlotIds,
  scheduleView,
  canManage,
  canRequestChanges,
  teacherSlotIds,
  getSubjectStyle,
  onSlotClick,
  onAddSlot,
}: TimetableMobileScheduleProps) {
  return (
    <div className="space-y-4 lg:hidden print:hidden">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-min gap-2">
          {visibleDays.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                selectedDay === day
                  ? 'bg-[#102E5C] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-[#1B3A6B]/30'
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#102E5C] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">Journée</p>
          <p className="text-base font-black text-white">{DAY_LABELS[selectedDay]}</p>
        </div>

        <div className="divide-y divide-slate-100">
          {displayTimeRows.map(row => {
            if (row.kind !== 'course') {
              const breakItem = breaks.find(item => item.id === row.id)
              const label = breakItem?.label ?? (row.kind === 'pause' ? 'Pause' : 'Déjeuner')
              const Icon = row.kind === 'pause' ? Coffee : Utensils
              return (
                <div key={row.id} className="flex items-center gap-3 bg-slate-50/80 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-slate-700">{row.label}</p>
                  </div>
                </div>
              )
            }

            const cellSlots = slotsByCell.get(`${selectedDay}:${row.start!}`) ?? []
            return (
              <div key={row.id} className="px-4 py-3">
                <p className="mb-2 text-xs font-black text-slate-400">{row.label}</p>
                {cellSlots.length === 0 ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-6 text-sm font-semibold text-slate-400 transition hover:border-[#1B3A6B]/30 hover:text-[#1B3A6B]"
                    disabled={!canManage || scheduleView !== 'class'}
                    onClick={() => canManage && scheduleView === 'class' && onAddSlot(selectedDay, row.start!, row.end!)}
                  >
                    <Plus className="h-4 w-4" />
                    {canManage && scheduleView === 'class' ? 'Ajouter un cours' : 'Créneau libre'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {cellSlots.map(slot => {
                      const style = getSubjectStyle(slot.subjectName)
                      const Icon = style.icon
                      const isOwnSlot = teacherSlotIds.has(slot.id)
                      const clickable = (canManage && scheduleView === 'class') || (canRequestChanges && isOwnSlot)
                      const hasConflict = conflictSlotIds.has(slot.id)
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => clickable && onSlotClick(slot)}
                          className={`w-full rounded-2xl border p-3.5 text-left shadow-sm transition ${
                            clickable ? 'active:scale-[0.99]' : ''
                          } ${hasConflict ? 'ring-2 ring-rose-400' : ''} ${style.card}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.color}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Icon className="h-4 w-4 shrink-0 opacity-75" />
                                <p className="text-sm font-black">{slot.subjectName}</p>
                                {hasConflict && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />}
                              </div>
                              <p className="mt-1 text-xs font-semibold opacity-75">{slot.teacherName}</p>
                              <p className="text-xs opacity-70">
                                {slot.className}{slot.room ? ` · Salle ${slot.room}` : ''}
                              </p>
                              {slot.description && (
                                <p className="mt-2 text-xs leading-relaxed italic opacity-80">{slot.description}</p>
                              )}
                            </div>
                            {clickable && <MoreHorizontal className="h-5 w-5 shrink-0 opacity-40" />}
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
      </div>
    </div>
  )
}
