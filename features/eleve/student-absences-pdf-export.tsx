'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateStudentAbsencesPdf } from '@/lib/pdf/student-absences-report'
import type { StudentAbsenceRecord } from '@/lib/eleve/student-attendance-shared'

type Props = {
  records: StudentAbsenceRecord[]
  studentName: string
  schoolName: string
  className: string
  schoolLogoUrl?: string | null
}

export function StudentAbsencesPdfExport({
  records,
  studentName,
  schoolName,
  className,
  schoolLogoUrl,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (records.length === 0) return
    setLoading(true)
    try {
      await generateStudentAbsencesPdf({
        records,
        studentName,
        schoolName,
        className,
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
      className="h-9 gap-1.5 text-xs"
      disabled={loading || records.length === 0}
      onClick={handleExport}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      Relevé PDF (familles)
    </Button>
  )
}
