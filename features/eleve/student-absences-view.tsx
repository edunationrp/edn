'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  UserX,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import {
  buildTrimesterRecap,
  countWindowAbsencesForAlert,
  filterRecordsByPeriod,
  type StudentAbsenceRecord,
} from '@/lib/eleve/student-attendance-shared'
import type { AbsenceAlertConfig } from '@/lib/attendance/absence-alerts'
import { StudentAbsencesCalendar } from '@/features/eleve/student-absences-calendar'
import { StudentAbsencesPdfExport } from '@/features/eleve/student-absences-pdf-export'

const JUSTIFICATION_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Justifiée',
  rejected: 'Refusée',
}

type StatusFilter = 'all' | 'absent' | 'late'
type PeriodFilter = 'all' | 'month' | 'trimester'

type Props = {
  records: StudentAbsenceRecord[]
  alertConfig: AbsenceAlertConfig
  className: string
  studentName: string
  schoolName: string
  schoolLogoUrl?: string | null
}

function justificationBadge(record: StudentAbsenceRecord) {
  if (!record.justification) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
        Non justifiée
      </span>
    )
  }
  const status = record.justification.status
  const classes =
    status === 'approved'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-800'
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', classes)}>
      {JUSTIFICATION_LABELS[status]}
    </span>
  )
}

function periodLabel(period: PeriodFilter) {
  if (period === 'month') return 'ce mois-ci'
  if (period === 'trimester') return 'ces 3 derniers mois'
  return 'cette année scolaire'
}

export function StudentAbsencesView({
  records,
  alertConfig,
  className,
  studentName,
  schoolName,
  schoolLogoUrl,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')

  const periodRecords = useMemo(
    () => filterRecordsByPeriod(records, periodFilter),
    [records, periodFilter],
  )

  const filtered = useMemo(() => {
    return periodRecords.filter(record => {
      if (statusFilter === 'absent') return record.status === 'absent'
      if (statusFilter === 'late') return record.status === 'late'
      return true
    })
  }, [periodRecords, statusFilter])

  const absences = periodRecords.filter(r => r.status === 'absent').length
  const lates = periodRecords.filter(r => r.status === 'late').length

  const windowAbsences = useMemo(
    () => countWindowAbsencesForAlert(records, alertConfig.windowDays),
    [records, alertConfig.windowDays],
  )

  const grouped = useMemo(() => {
    const bySubject: Record<string, StudentAbsenceRecord[]> = {}
    for (const record of filtered) {
      if (!bySubject[record.subjectName]) bySubject[record.subjectName] = []
      bySubject[record.subjectName].push(record)
    }
    return Object.keys(bySubject)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map(subject => ({ subject, items: bySubject[subject] }))
  }, [filtered])

  const gaugePercent = Math.min(100, Math.round((windowAbsences / alertConfig.threshold) * 100))
  const nearThreshold = windowAbsences >= alertConfig.threshold - 1
  const exceedsThreshold = windowAbsences >= alertConfig.threshold

  const trimesterRecap = useMemo(() => buildTrimesterRecap(records), [records])

  const hasActiveFilters = statusFilter !== 'all' || periodFilter !== 'all'

  function clearFilters() {
    setStatusFilter('all')
    setPeriodFilter('all')
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes absences & retards</h1>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">
              Suivi de ta présence en classe ({className}). Les justifications sont déposées par ta
              famille depuis l&apos;espace parent.
            </p>
          </div>
          <StudentAbsencesPdfExport
            records={records}
            studentName={studentName}
            schoolName={schoolName}
            className={className}
            schoolLogoUrl={schoolLogoUrl}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-red-100 bg-red-50 px-3 py-4 shadow-sm">
          <UserX className="h-5 w-5 text-red-500" />
          <p className="text-2xl font-bold tabular-nums text-red-600">{absences}</p>
          <p className="text-center text-xs font-medium text-red-800/80">Absences</p>
          <p className="text-center text-[10px] text-red-700/60">{periodLabel(periodFilter)}</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-orange-50 px-3 py-4 shadow-sm">
          <Clock className="h-5 w-5 text-orange-500" />
          <p className="text-2xl font-bold tabular-nums text-orange-600">{lates}</p>
          <p className="text-center text-xs font-medium text-orange-800/80">Retards</p>
          <p className="text-center text-[10px] text-orange-700/60">{periodLabel(periodFilter)}</p>
        </div>
      </div>

      {records.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">Récapitulatif par trimestre</h2>
          <p className="mt-0.5 text-xs text-slate-500">Synthèse de l&apos;année scolaire en cours</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {trimesterRecap.map(term => (
              <div
                key={term.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
              >
                <p className="text-xs font-bold text-[#1B3A6B]">{term.label}</p>
                <p className="text-[10px] text-slate-500">{term.periodHint}</p>
                <div className="mt-2 flex gap-4">
                  <div>
                    <p className="text-lg font-bold tabular-nums text-red-600">{term.absences}</p>
                    <p className="text-[10px] text-slate-600">Absences</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums text-orange-600">{term.lates}</p>
                    <p className="text-[10px] text-slate-600">Retards</p>
                  </div>
                </div>
                {term.subjectCount > 0 && (
                  <p className="mt-2 text-[10px] text-slate-500">
                    {term.subjectCount === 1
                      ? '1 matière concernée'
                      : `${term.subjectCount} matières concernées`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {records.length > 0 && <StudentAbsencesCalendar records={records} />}

      {records.some(r => r.status === 'absent') && (
        <div
          className={cn(
            'rounded-2xl border bg-white px-4 py-3 shadow-sm sm:px-5',
            exceedsThreshold ? 'border-red-200' : nearThreshold ? 'border-amber-200' : 'border-slate-200',
          )}
        >
          <div className="flex items-start gap-2">
            {exceedsThreshold || nearThreshold ? (
              <AlertTriangle
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  exceedsThreshold ? 'text-red-500' : 'text-amber-500',
                )}
              />
            ) : (
              <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {windowAbsences === 1
                  ? '1 absence non justifiée'
                  : `${windowAbsences} absences non justifiées`}{' '}
                sur les {alertConfig.windowDays} derniers jours
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Seuil d&apos;attention de l&apos;établissement : {alertConfig.threshold} absences
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    exceedsThreshold
                      ? 'bg-red-500'
                      : nearThreshold
                        ? 'bg-amber-500'
                        : 'bg-emerald-500',
                  )}
                  style={{ width: `${gaugePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all' as const, label: 'Tout' },
                { id: 'absent' as const, label: 'Absences' },
                { id: 'late' as const, label: 'Retards' },
              ] as const
            ).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  statusFilter === item.id
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
            className="h-9 min-w-[10rem] rounded-xl border bg-white px-3 text-xs sm:text-sm"
          >
            <option value="all">Année scolaire</option>
            <option value="month">Ce mois-ci</option>
            <option value="trimester">3 derniers mois</option>
          </select>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" className="h-9 gap-1 px-2 text-xs" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Effacer
            </Button>
          )}
        </div>
      )}

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-10 text-center shadow-sm">
          <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <p className="text-sm font-semibold text-gray-800">Aucune absence enregistrée</p>
          <p className="mt-1 text-xs text-slate-600">Continue comme ça — ta assiduité est suivie ici.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">Aucun résultat pour ces filtres</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
            Réinitialiser
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ subject, items }) => (
            <section key={subject} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-bold text-[#1B3A6B] sm:text-base">{subject}</h2>
                <p className="text-xs text-slate-500">
                  {items.length} entrée{items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="relative px-4 py-3 sm:px-5">
                <div className="absolute bottom-3 left-[1.125rem] top-3 w-px bg-slate-100" />
                <ul className="space-y-0">
                  {items.map(record => {
                    const isAbsent = record.status === 'absent'
                    return (
                      <li key={record.id} className="relative flex gap-4 py-3">
                        <div
                          className={cn(
                            'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm',
                            isAbsent
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : 'border-orange-200 bg-orange-50 text-orange-600',
                          )}
                        >
                          {isAbsent ? <UserX className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1 border-b border-slate-50 pb-3 last:border-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {isAbsent ? 'Absence' : 'Retard'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatRelativeDate(record.recordedAt)}
                                <span className="mx-1 text-slate-300">·</span>
                                {formatDate(record.recordedAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant={isAbsent ? 'destructive' : 'secondary'} className="text-[10px]">
                                {isAbsent ? 'Absent' : 'Retard'}
                              </Badge>
                              {isAbsent && justificationBadge(record)}
                            </div>
                          </div>
                          {record.justification ? (
                            <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                              <p className="font-medium text-slate-700">
                                {record.justification.status === 'pending'
                                  ? 'Ta famille a déposé une justification — en attente de validation.'
                                  : record.justification.status === 'approved'
                                    ? 'Justification acceptée par l\'établissement.'
                                    : 'Justification refusée — ta famille peut en soumettre une nouvelle.'}
                              </p>
                            </div>
                          ) : isAbsent ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Non justifiée pour l&apos;instant. Ta famille peut réagir depuis l&apos;espace
                              parent EduNation.
                            </p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
