import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StudentBulletinDetailClient } from '@/features/eleve/student-bulletin-detail-client'
import { StudentBulletinDetailToolbar } from '@/features/eleve/student-bulletin-detail-toolbar'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'
import {
  buildBulletinCardSummary,
  gradeToneClass,
} from '@/lib/report-cards/bulletin-summary'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon bulletin — EduNation' }

export default async function EleveBulletinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, school_id')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as { id: string; school_id: string } | null
  if (!student) redirect('/login/eleve')

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('logo_url')
    .eq('id', student.school_id)
    .single()

  const school = schoolRaw as { logo_url: string | null } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cardRaw } = await (supabase as any)
    .from('report_cards')
    .select('id, student_id, term, period, average, rank, class_size, status, snapshot_json, is_published, school_years(name)')
    .eq('id', id)
    .eq('student_id', student.id)
    .maybeSingle()

  const card = cardRaw as {
    id: string
    term: string | null
    period: string | null
    average: number | null
    rank: number | null
    class_size: number | null
    status: string
    is_published: boolean
    snapshot_json: BulletinSnapshot | null
    school_years: { name: string } | null
  } | null

  if (!card || (!card.is_published && card.status !== 'published')) notFound()
  if (!card.snapshot_json) notFound()

  const summary = buildBulletinCardSummary(
    card.period,
    card.term,
    card.school_years?.name ?? null,
    card.snapshot_json,
    card.average,
    card.rank,
    card.class_size,
  )

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="mb-2 h-8 px-2 text-xs" asChild>
              <Link href="/eleve/bulletins">← Mes bulletins</Link>
            </Button>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">{summary.title}</h1>
            {summary.schoolYear && (
              <p className="text-xs text-slate-500">Année scolaire {summary.schoolYear}</p>
            )}
            {summary.generalAverage !== null && (
              <p className="mt-1 text-sm text-slate-600">
                Moyenne générale :{' '}
                <span className={cn('font-bold tabular-nums', gradeToneClass(summary.generalAverage))}>
                  {summary.generalAverage.toFixed(2)}/20
                </span>
                {summary.rankLabel && (
                  <span className="text-slate-500"> · {summary.rankLabel}</span>
                )}
              </p>
            )}
          </div>
          <StudentBulletinDetailToolbar
            snapshot={card.snapshot_json}
            period={card.period}
            term={card.term}
            schoolYearName={card.school_years?.name ?? null}
            average={card.average}
            rank={card.rank}
            classSize={card.class_size}
            schoolLogoUrl={school?.logo_url ?? card.snapshot_json.school.logoUrl}
          />
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement du bulletin…</div>}>
        <StudentBulletinDetailClient snapshot={card.snapshot_json} />
      </Suspense>
    </div>
  )
}
