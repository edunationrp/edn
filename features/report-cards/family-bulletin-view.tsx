'use client'

import { BfOfficialV1Bulletin } from '@/features/report-cards/templates/bf-official-v1'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export function FamilyBulletinView({ snapshot }: { snapshot: BulletinSnapshot }) {
  return (
    <BfOfficialV1Bulletin
      snapshot={snapshot}
      showActions
      onPrint={() => window.print()}
      onDownload={() => window.print()}
    />
  )
}
