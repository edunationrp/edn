'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Printer, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildBulletinCardSummary,
  gradeToneClass,
} from '@/lib/report-cards/bulletin-summary'
import { buildBulletinClassHints } from '@/lib/report-cards/bulletin-class-hints'
import {
  normalizeBulletinTermCode,
  notesTermHref,
} from '@/lib/report-cards/bulletin-term'
import { StudentBulletinPdfExport } from '@/features/eleve/student-bulletin-pdf-export'
import type { FamilyBulletinListItem } from '@/features/report-cards/family-bulletins-list'

type Props = {
  bulletins: FamilyBulletinListItem[]
  schoolLogoUrl?: string | null
}

export function StudentBulletinsList({ bulletins, schoolLogoUrl }: Props) {
  if (bulletins.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-gray-800">Aucun bulletin publié</p>
        <p className="mt-1 text-xs text-slate-600">
          Ton bulletin apparaîtra ici dès sa publication par l&apos;établissement.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bulletins.map(bulletin => {
        const summary = buildBulletinCardSummary(
          bulletin.period,
          bulletin.term,
          bulletin.schoolYearName,
          bulletin.snapshot,
          bulletin.average,
          bulletin.rank,
          bulletin.class_size,
        )
        const classHints = buildBulletinClassHints(bulletin.snapshot, 2)
        const termCode = normalizeBulletinTermCode(bulletin.term, bulletin.snapshot)

        return (
          <article
            key={bulletin.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 sm:text-lg">{summary.title}</h2>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">Publié</Badge>
                  </div>
                  {summary.schoolYear && (
                    <p className="mt-0.5 text-xs text-slate-500">Année scolaire {summary.schoolYear}</p>
                  )}
                </div>
                {summary.generalAverage !== null && (
                  <div className="flex shrink-0 flex-col items-center rounded-xl border border-slate-200 bg-white px-4 py-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Moyenne
                    </span>
                    <span
                      className={cn(
                        'text-2xl font-bold tabular-nums',
                        gradeToneClass(summary.generalAverage),
                      )}
                    >
                      {summary.generalAverage.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">/20</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-5">
              {summary.rankLabel && (
                <p className="text-sm text-slate-600">
                  Classement : <span className="font-semibold text-gray-800">{summary.rankLabel}</span>
                </p>
              )}

              {summary.appreciation !== '—' && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-gray-900">Appréciation générale : </span>
                  {summary.appreciation}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                {summary.bestSubject && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Fort en {summary.bestSubject}
                  </span>
                )}
                {summary.focusSubject && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">
                    <TrendingDown className="h-3.5 w-3.5" />
                    À renforcer : {summary.focusSubject}
                  </span>
                )}
              </div>

              {classHints.length > 0 && (
                <ul className="space-y-1 text-xs text-slate-600">
                  {classHints.map(hint => (
                    <li key={hint.subjectName}>
                      <span className="font-medium text-gray-800">{hint.subjectName}</span>
                      {' — '}
                      {hint.message}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Button asChild size="sm" className="bg-[#1B3A6B] hover:bg-[#15305a]">
                  <Link href={`/eleve/bulletins/${bulletin.id}`}>Voir le bulletin</Link>
                </Button>
                {termCode && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={notesTermHref(termCode)}>
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                      Notes
                    </Link>
                  </Button>
                )}
                <StudentBulletinPdfExport
                  snapshot={bulletin.snapshot}
                  period={bulletin.period}
                  term={bulletin.term}
                  schoolYearName={bulletin.schoolYearName}
                  average={bulletin.average}
                  rank={bulletin.rank}
                  classSize={bulletin.class_size}
                  schoolLogoUrl={schoolLogoUrl ?? bulletin.snapshot.school.logoUrl}
                />
                <Button asChild size="sm" variant="outline">
                  <Link href={`/eleve/bulletins/${bulletin.id}?print=1`}>
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Imprimer
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
