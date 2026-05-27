'use client'

import { DAY_LABELS } from '@/lib/timetable/constants'
import { clampWatermarkOpacity } from '@/lib/schools/branding'
import type { GridTimeRow } from '@/lib/timetable/grid-utils'
import type { TimetableBreakView, TimetablePageMeta, TimetableSlotView } from '@/lib/timetable/types'

type LegendItem = {
  label: string
  color: string
}

type TimetablePrintSheetProps = {
  schoolName: string
  logoUrl?: string | null
  watermarkOpacity?: number | null
  meta: TimetablePageMeta
  subtitle: string
  visibleDays: number[]
  displayTimeRows: GridTimeRow[]
  breaks: TimetableBreakView[]
  slotsByCell: Map<string, TimetableSlotView[]>
  legendItems: LegendItem[]
}

export function TimetablePrintSheet({
  schoolName,
  logoUrl,
  watermarkOpacity,
  meta,
  subtitle,
  visibleDays,
  displayTimeRows,
  breaks,
  slotsByCell,
  legendItems,
}: TimetablePrintSheetProps) {
  const safeOpacity = clampWatermarkOpacity(watermarkOpacity)

  return (
    <div className="timetable-print-only hidden">
      <div className="timetable-print-sheet">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            aria-hidden
            className="timetable-print-watermark"
            style={{ opacity: safeOpacity }}
          />
        )}

        <div className="timetable-print-content">
          <header className="timetable-print-header">
            <div className="timetable-print-header-brand">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="timetable-print-logo" />
              ) : (
                <div className="timetable-print-logo-placeholder" />
              )}
              <div>
                <p className="timetable-print-school">{schoolName}</p>
                <h1 className="timetable-print-title">Emploi du temps</h1>
                <p className="timetable-print-subtitle">{subtitle}</p>
              </div>
            </div>
            <div className="timetable-print-meta">
              <span>{meta.schoolYearName}</span>
              <span>{meta.termName}</span>
            </div>
          </header>

          <table className="timetable-print-grid">
            <thead>
              <tr>
                <th className="timetable-print-time-col">Heures</th>
                {visibleDays.map(day => (
                  <th key={day}>{DAY_LABELS[day]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayTimeRows.map(row => {
                if (row.kind !== 'course') {
                  const breakItem = breaks.find(item => item.id === row.id)
                  const label = breakItem?.label ?? (row.kind === 'pause' ? 'Pause' : 'Déjeuner')
                  return (
                    <tr key={row.id} className="timetable-print-break-row">
                      <td className="timetable-print-time-col">{row.label}</td>
                      {visibleDays.map(day => (
                        <td key={`${row.id}-${day}`} className="timetable-print-break-cell">
                          {label}
                        </td>
                      ))}
                    </tr>
                  )
                }

                return (
                  <tr key={row.id}>
                    <td className="timetable-print-time-col">{row.label}</td>
                    {visibleDays.map(day => {
                      const cellSlots = slotsByCell.get(`${day}:${row.start!}`) ?? []
                      return (
                        <td key={`${row.id}-${day}`} className="timetable-print-cell">
                          {cellSlots.length === 0 ? (
                            <span className="timetable-print-empty">—</span>
                          ) : (
                            cellSlots.map(slot => (
                              <div key={slot.id} className="timetable-print-slot">
                                <p className="timetable-print-slot-subject">{slot.subjectName}</p>
                                <p className="timetable-print-slot-meta">{slot.teacherName}</p>
                                <p className="timetable-print-slot-meta">
                                  {slot.className}{slot.room ? ` · ${slot.room}` : ''}
                                </p>
                                {slot.description && (
                                  <p className="timetable-print-slot-desc">{slot.description}</p>
                                )}
                              </div>
                            ))
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {legendItems.length > 0 && (
            <footer className="timetable-print-legend">
              {legendItems.map(item => (
                <span key={item.label} className="timetable-print-legend-item">
                  <span className={`timetable-print-legend-dot ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}
