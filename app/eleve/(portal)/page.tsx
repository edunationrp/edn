import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, UserX, FileText, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchPublishedStudentGrades,
  latestPublishedTermAverage,
  recentPublishedGradeEntries,
} from '@/lib/grades/published-notes'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mon espace — EduNation',
}

function getScoreColor(value: number, max = 20) {
  const ratio = value / max
  if (ratio >= 0.7) return 'text-emerald-600'
  if (ratio >= 0.5) return 'text-amber-500'
  return 'text-red-500'
}

function getScoreBg(value: number, max = 20) {
  const ratio = value / max
  if (ratio >= 0.7) return 'bg-emerald-50 border-emerald-100'
  if (ratio >= 0.5) return 'bg-amber-50 border-amber-100'
  return 'bg-red-50 border-red-100'
}

function ScoreTrend({ value, max = 20 }: { value: number; max?: number }) {
  const ratio = value / max
  if (ratio >= 0.7) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (ratio >= 0.5) return <Minus className="h-3.5 w-3.5 text-amber-400" />
  return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
}

export default async function EleveDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, first_name, last_name, iun, student_enrollments(classes(name), school_years(is_active))')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as {
    id: string
    first_name: string
    last_name: string
    iun: string
    student_enrollments: Array<{
      classes: { name: string } | null
      school_years: { is_active: boolean } | null
    }>
  } | null
  if (!student) redirect('/login/eleve')

  const activeEnrollment = student.student_enrollments?.find(e => e.school_years?.is_active)
  const className = activeEnrollment?.classes?.name ?? null

  const initials = [student.first_name[0], student.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()

  const [publishedTerms, { count: absenceCount }, { count: bulletinCount }, { data: latestBulletinRaw }] = await Promise.all([
    fetchPublishedStudentGrades(supabase, student.id),
    supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .eq('status', 'absent'),
    supabase
      .from('report_cards')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .or('is_published.eq.true,status.eq.published'),
    supabase
      .from('report_cards')
      .select('average, snapshot_json')
      .eq('student_id', student.id)
      .or('is_published.eq.true,status.eq.published')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const recentGrades = recentPublishedGradeEntries(publishedTerms, 6)
  const moyenneFromNotes = latestPublishedTermAverage(publishedTerms)

  const latestBulletin = latestBulletinRaw as {
    average: number | null
    snapshot_json: { generalAverage: number | null } | null
  } | null

  const bulletinAverage =
    latestBulletin?.average
    ?? latestBulletin?.snapshot_json?.generalAverage
    ?? null

  const displayedAverage = bulletinAverage ?? moyenneFromNotes

  return (
    <div className="w-full min-w-0 space-y-5">

      {/* Bandeau identité */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#2d5499] text-lg font-bold text-white shadow-md">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-gray-900">
            {student.first_name} {student.last_name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {className && (
              <span className="rounded-full bg-[#1B3A6B]/8 px-2 py-0.5 font-medium text-[#1B3A6B]">
                {className}
              </span>
            )}
            <span className="font-mono tracking-wide">{student.iun}</span>
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B3A6B]/10">
            <BookOpen className="h-4.5 w-4.5 text-[#1B3A6B]" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-[#1B3A6B]">
            {displayedAverage !== null ? displayedAverage.toFixed(1) : '—'}
          </p>
          <p className="text-center text-[10px] leading-tight text-muted-foreground">
            {bulletinAverage !== null ? 'Moy. bulletin' : 'Moyenne'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-orange-100 bg-orange-50 px-3 py-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
            <UserX className="h-4.5 w-4.5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-orange-500">{absenceCount ?? 0}</p>
          <p className="text-center text-[10px] leading-tight text-muted-foreground">Absences</p>
        </div>

        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
            <FileText className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-emerald-600">{bulletinCount ?? 0}</p>
          <p className="text-center text-[10px] leading-tight text-muted-foreground">Bulletins</p>
        </div>
      </div>

      {/* Timeline des dernières notes */}
      {recentGrades.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-gray-900">Dernières notes publiées</p>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-[#1B3A6B]" asChild>
              <Link href="/eleve/notes">
                Tout voir
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="relative px-5 py-3">
            {/* Ligne verticale de la timeline */}
            <div className="absolute left-[2.125rem] top-3 bottom-3 w-px bg-slate-100" />

            <div className="space-y-0">
              {recentGrades.map((grade, index) => (
                <div key={index} className="relative flex items-start gap-4 py-2.5">
                  {/* Point de la timeline */}
                  <div className={cn(
                    'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm',
                    getScoreBg(grade.value),
                    getScoreColor(grade.value),
                  )}>
                    <ScoreTrend value={grade.value} />
                  </div>

                  {/* Contenu */}
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{grade.subjectName}</p>
                      <p className="text-[11px] text-muted-foreground">{grade.slotLabel}</p>
                    </div>
                    <span className={cn(
                      'shrink-0 rounded-lg border px-2.5 py-1 text-sm font-bold tabular-nums',
                      getScoreBg(grade.value),
                      getScoreColor(grade.value),
                    )}>
                      {grade.value.toFixed(2).replace(/\.?0+$/, '')}
                      <span className="ml-0.5 text-[10px] font-normal opacity-60">/20</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {recentGrades.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Aucune note publiée pour l&apos;instant</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Tes notes apparaîtront ici dès leur publication</p>
        </div>
      )}
    </div>
  )
}
