'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { buildDayMarkers, type StudentAbsenceRecord } from '@/lib/eleve/student-attendance-shared'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

type Props = {
  records: StudentAbsenceRecord[]
}

export function StudentAbsencesCalendar({ records }: Props) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))

  const dayMarkers = useMemo(() => buildDayMarkers(records), [records])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [viewMonth])

  const [pickedDay, setPickedDay] = useState<Date | null>(null)

  const pickedRecords = useMemo(() => {
    if (!pickedDay) return []
    return records.filter(r => isSameDay(new Date(r.recordedAt), pickedDay))
  }, [records, pickedDay])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">Calendrier</h2>
          <p className="text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Absence
            </span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Retard
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => setViewMonth(m => subMonths(m, 1))}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[8rem] text-center text-sm font-semibold capitalize text-[#1B3A6B]">
            {format(viewMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => setViewMonth(m => addMonths(m, 1))}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500">
        {WEEKDAYS.map(day => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const marker = dayMarkers.get(key)
          const inMonth = isSameMonth(day, viewMonth)
          const isPicked = pickedDay && isSameDay(day, pickedDay)

          return (
            <button
              key={key}
              type="button"
              onClick={() => setPickedDay(prev => (prev && isSameDay(prev, day) ? null : day))}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors',
                inMonth ? 'text-gray-800' : 'text-slate-300',
                isPicked && 'bg-[#1B3A6B]/10 ring-2 ring-[#1B3A6B]/30',
                !isPicked && marker && inMonth && 'hover:bg-slate-50',
                !marker && inMonth && 'hover:bg-slate-50',
              )}
            >
              <span className={cn('font-medium', !inMonth && 'font-normal')}>
                {format(day, 'd')}
              </span>
              {marker && inMonth && (
                <span className="mt-0.5 flex gap-0.5">
                  {(marker === 'absent' || marker === 'both') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                  {(marker === 'late' || marker === 'both') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {pickedDay && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="text-xs font-semibold text-[#1B3A6B]">
            {format(pickedDay, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
          {pickedRecords.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">Aucune absence ni retard ce jour-là.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {pickedRecords.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-700">{r.subjectName}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-semibold',
                      r.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700',
                    )}
                  >
                    {r.status === 'absent' ? 'Absent' : 'Retard'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
