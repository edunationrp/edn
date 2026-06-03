'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FamilyBulletinView } from '@/features/report-cards/family-bulletin-view'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

type Props = {
  snapshot: BulletinSnapshot
}

export function StudentBulletinDetailClient({ snapshot }: Props) {
  const searchParams = useSearchParams()
  const autoPrint = searchParams.get('print') === '1'

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 600)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  return <FamilyBulletinView snapshot={snapshot} />
}
