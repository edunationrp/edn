'use client'

import { cn } from '@/lib/utils'
import type { SubjectFilterOption } from '@/lib/timetable/student-timetable-helpers'

export type TimetableViewMode = 'week' | 'day'

type Props = {
  viewMode: TimetableViewMode
  onViewModeChange: (mode: TimetableViewMode) => void
  subjects: SubjectFilterOption[]
  subjectFilter: string | null
  onSubjectFilterChange: (subjectId: string | null) => void
  filteredCount: number
  totalCount: number
}

export function StudentTimetableToolbar({
  viewMode,
  onViewModeChange,
  subjects,
  subjectFilter,
  onSubjectFilterChange,
  filteredCount,
  totalCount,
}: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition',
              viewMode === 'week'
                ? 'bg-white text-[#1B3A6B] shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition',
              viewMode === 'day'
                ? 'bg-white text-[#1B3A6B] shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Jour
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {filteredCount === totalCount
            ? `${totalCount} créneau${totalCount !== 1 ? 'x' : ''}`
            : `${filteredCount} / ${totalCount} créneaux`}
        </p>
      </div>

      {subjects.length > 1 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <button
            type="button"
            onClick={() => onSubjectFilterChange(null)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition sm:shrink',
              !subjectFilter
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            Toutes
          </button>
          {subjects.map(subject => (
            <button
              key={subject.id}
              type="button"
              onClick={() =>
                onSubjectFilterChange(subjectFilter === subject.id ? null : subject.id)
              }
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition sm:shrink',
                subjectFilter === subject.id
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {subject.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
