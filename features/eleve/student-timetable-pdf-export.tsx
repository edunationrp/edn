'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateStudentTimetablePdf } from '@/lib/pdf/student-timetable-report'
import type { GridTimeRow } from '@/lib/timetable/grid-utils'
import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'
import { cn } from '@/lib/utils'

type Props = {
  slots: TimetableSlotView[]
  displayTimeRows: GridTimeRow[]
  breaks: TimetableBreakView[]
  studentName: string
  schoolName: string
  className: string
  schoolYearName?: string | null
  schoolLogoUrl?: string | null
  buttonClassName?: string
}

export function StudentTimetablePdfExport({
  slots,
  displayTimeRows,
  breaks,
  studentName,
  schoolName,
  className,
  schoolYearName,
  schoolLogoUrl,
  buttonClassName,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (slots.length === 0) return
    setLoading(true)
    try {
      await generateStudentTimetablePdf({
        slots,
        displayTimeRows,
        breaks,
        studentName,
        schoolName,
        className,
        schoolYearName,
        schoolLogoUrl,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-2', buttonClassName)}
      disabled={loading || slots.length === 0}
      onClick={handleExport}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">Télécharger PDF</span>
    </Button>
  )
}
