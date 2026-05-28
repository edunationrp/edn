'use client'

import type { ComponentType } from 'react'
import { DAY_LABELS, DAY_SHORT_LABELS } from '@/lib/timetable/constants'
import type { GridTimeRow } from '@/lib/timetable/grid-utils'
import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'
import {
  AlertTriangle,
  ChevronRight,
  Coffee,
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
  viewOnly?: boolean
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
  viewOnly = false,
  onSlotClick,
  onAddSlot,
}: TimetableMobileScheduleProps) {
  return (
    <div className="w-full min-w-0 space-y-3 lg:hidden print:hidden">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {visibleDays.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(day)}
            className={`min-w-0 rounded-xl px-2 py-2.5 text-center text-xs font-black transition sm:px-3 sm:py-3 sm:text-sm ${
              selectedDay === day
                ? 'bg-[#102E5C] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 active:bg-slate-50'
            }`}
          >
            <span className="sm:hidden">{DAY_SHORT_LABELS[day]}</span>
            <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
          </button>
        ))}
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#102E5C] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Journée</p>
          <p className="text-base font-black text-white">{DAY_LABELS[selectedDay]}</p>
        </div>

        <div className="divide-y divide-slate-100">
          {displayTimeRows.map(row => {
            if (row.kind !== 'course') {
              const breakItem = breaks.find(item => item.id === row.id)
              const label = breakItem?.label ?? (row.kind === 'pause' ? 'Pause' : 'Déjeuner')
              const Icon = row.kind === 'pause' ? Coffee : Utensils
              return (
                <div key={row.id} className="flex items-center gap-3 bg-slate-50/80 px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm sm:h-9 sm:w-9">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-slate-700">{row.label}</p>
                  </div>
                </div>
              )
            }

            const cellSlots = slotsByCell.get(`${selectedDay}:${row.start!}`) ?? []
            return (
              <div key={row.id} className="px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{row.label}</p>
                {cellSlots.length === 0 ? (
                  viewOnly ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-center text-xs font-medium text-slate-400">
                      Créneau libre
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-5 text-sm font-semibold text-slate-400 transition hover:border-[#1B3A6B]/30 hover:text-[#1B3A6B] sm:py-6"
                      disabled={!canManage || scheduleView !== 'class'}
                      onClick={() => canManage && scheduleView === 'class' && onAddSlot(selectedDay, row.start!, row.end!)}
                    >
                      <Plus className="h-4 w-4" />
                      {canManage && scheduleView === 'class' ? 'Ajouter un cours' : 'Créneau libre'}
                    </button>
                  )
                ) : (
                  <div className="space-y-2">
                    {cellSlots.map(slot => {
                      const style = getSubjectStyle(slot.subjectName)
                      const Icon = style.icon
                      const isOwnSlot = teacherSlotIds.has(slot.id)
                      const clickable = viewOnly
                        ? cellSlots.length > 0
                        : (canManage && scheduleView === 'class') || (canRequestChanges && isOwnSlot)
                      const hasConflict = conflictSlotIds.has(slot.id)
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => clickable && onSlotClick(slot)}
                          className={`w-full min-w-0 rounded-2xl border p-3 text-left shadow-sm transition sm:p-3.5 ${
                            clickable ? 'active:scale-[0.99]' : ''
                          } ${hasConflict ? 'ring-2 ring-rose-400' : ''} ${style.card}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.color}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-1.5">
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-75" />
                                <p className="min-w-0 flex-1 text-sm font-black leading-snug">{slot.subjectName}</p>
                                {hasConflict && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />}
                              </div>
                              <p className="mt-1 text-xs font-semibold opacity-75">{slot.teacherName}</p>
                              {!viewOnly && (
                                <p className="text-xs opacity-70">
                                  {slot.className}{slot.room ? ` · Salle ${slot.room}` : ''}
                                </p>
                              )}
                              {viewOnly && slot.room && (
                                <p className="text-xs opacity-70">Salle {slot.room}</p>
                              )}
                              {slot.description && !viewOnly && (
                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed italic opacity-80">{slot.description}</p>
                              )}
                            </div>
                            {clickable && (
                              viewOnly
                                ? <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 opacity-40" />
                                : null
                            )}
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
