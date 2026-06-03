'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Minus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { gradeToneClass } from '@/lib/report-cards/bulletin-summary'
import {
  buildBulletinEvolution,
  listSchoolYears,
  pickPrimarySchoolYear,
  type BulletinEvolutionInput,
} from '@/lib/report-cards/bulletin-evolution'
import type { BulletinTermCode } from '@/lib/report-cards/bulletin-term'

type Props = {
  bulletins: BulletinEvolutionInput[]
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  if (Math.abs(delta) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
        <Minus className="h-3 w-3" />
        stable
      </span>
    )
  }
  const up = delta > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-medium',
        up ? 'text-emerald-700' : 'text-amber-800',
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {delta.toFixed(2)}
    </span>
  )
}

export function StudentBulletinsEvolution({ bulletins }: Props) {
  const years = useMemo(() => listSchoolYears(bulletins), [bulletins])
  const defaultYear = useMemo(() => pickPrimarySchoolYear(bulletins), [bulletins])
  const [schoolYear, setSchoolYear] = useState<string | null>(null)

  const activeYear = schoolYear ?? defaultYear
  const points = useMemo(
    () => buildBulletinEvolution(bulletins, activeYear),
    [bulletins, activeYear],
  )

  const publishedCount = points.filter(p => p.average !== null).length
  if (publishedCount < 2) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#1B3A6B]" />
            <h2 className="text-sm font-bold text-gray-900">Évolution trimestrielle</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-600">
            Moyennes générales publiées
            {activeYear ? ` · ${activeYear}` : ''}
          </p>
        </div>
        {years.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {years.map(year => (
              <button
                key={year}
                type="button"
                onClick={() => setSchoolYear(year)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
                  activeYear === year
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {points.map((point, index) => {
          const termKey = point.term as BulletinTermCode
          const content = (
            <div
              className={cn(
                'flex flex-col items-center rounded-xl border px-2 py-3 text-center transition-colors',
                point.average !== null
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-dashed border-slate-200 bg-white text-slate-400',
                point.bulletinId && 'hover:border-[#1B3A6B]/40 hover:bg-white',
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {termKey}
              </span>
              {point.average !== null ? (
                <>
                  <span
                    className={cn(
                      'mt-1 text-lg font-bold tabular-nums sm:text-xl',
                      gradeToneClass(point.average),
                    )}
                  >
                    {point.average.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">/20</span>
                  {index > 0 && (
                    <div className="mt-1">
                      <DeltaBadge delta={point.deltaFromPrevious} />
                    </div>
                  )}
                </>
              ) : (
                <span className="mt-2 text-xs">—</span>
              )}
            </div>
          )

          if (!point.bulletinId) return <div key={point.term}>{content}</div>

          return (
            <Link key={point.term} href={`/eleve/bulletins/${point.bulletinId}`} className="block">
              {content}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
