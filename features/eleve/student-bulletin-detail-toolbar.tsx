'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentBulletinPdfExport } from '@/features/eleve/student-bulletin-pdf-export'
import { StudentBulletinQrDialog } from '@/features/eleve/student-bulletin-qr-dialog'
import {
  normalizeBulletinTermCode,
  notesTermHref,
} from '@/lib/report-cards/bulletin-term'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

type Props = {
  snapshot: BulletinSnapshot
  period: string | null
  term: string | null
  schoolYearName: string | null
  average: number | null
  rank: number | null
  classSize: number | null
  schoolLogoUrl?: string | null
}

export function StudentBulletinDetailToolbar({
  snapshot,
  period,
  term,
  schoolYearName,
  average,
  rank,
  classSize,
  schoolLogoUrl,
}: Props) {
  const termCode = normalizeBulletinTermCode(term, snapshot)

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {termCode && (
        <Button asChild size="sm" variant="outline">
          <Link href={notesTermHref(termCode)}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Notes détaillées
          </Link>
        </Button>
      )}
      <StudentBulletinPdfExport
        snapshot={snapshot}
        period={period}
        term={term}
        schoolYearName={schoolYearName}
        average={average}
        rank={rank}
        classSize={classSize}
        schoolLogoUrl={schoolLogoUrl}
      />
      <StudentBulletinQrDialog snapshot={snapshot} />
    </div>
  )
}
