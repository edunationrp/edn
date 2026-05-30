'use client'

import { Badge } from '@/components/ui/badge'
import { FamilyBulletinView } from '@/features/report-cards/family-bulletin-view'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export type FamilyBulletinListItem = {
  id: string
  period: string | null
  term: string | null
  average: number | null
  rank: number | null
  class_size: number | null
  schoolYearName: string | null
  snapshot: BulletinSnapshot
}

type Props = {
  bulletins: FamilyBulletinListItem[]
  emptyMessage?: string
}

export function FamilyBulletinsList({
  bulletins,
  emptyMessage = 'Aucun bulletin publié pour le moment.',
}: Props) {
  if (bulletins.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="space-y-10">
      {bulletins.map(bulletin => {
        const title = bulletin.period ?? bulletin.term ?? 'Bulletin'
        const subtitle = bulletin.schoolYearName ? ` · ${bulletin.schoolYearName}` : ''

        return (
          <section key={bulletin.id} id={`bulletin-${bulletin.id}`} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {title}
                  {subtitle && (
                    <span className="font-normal text-muted-foreground">{subtitle}</span>
                  )}
                </h2>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {bulletin.average !== null && (
                    <span>
                      Moyenne{' '}
                      <span className="font-semibold text-[#1B3A6B]">
                        {bulletin.average.toFixed(2)} / 20
                      </span>
                    </span>
                  )}
                  {bulletin.rank !== null && bulletin.class_size !== null && (
                    <span>
                      Classement{' '}
                      <span className="font-medium text-gray-800">
                        {bulletin.rank}<sup>e</sup> / {bulletin.class_size}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <Badge className="shrink-0 bg-emerald-600 hover:bg-emerald-600">Publié</Badge>
            </div>

            <FamilyBulletinView snapshot={bulletin.snapshot} />
          </section>
        )
      })}
    </div>
  )
}
