import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, UserX, FileText, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchPublishedStudentGrades,
  latestPublishedTermAverage,
  recentPublishedGradeEntries,
} from '@/lib/grades/published-notes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mon espace — EduNation',
}

export default async function EleveDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, first_name')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as { id: string; first_name: string } | null
  if (!student) redirect('/login/eleve')

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

  const recentGrades = recentPublishedGradeEntries(publishedTerms, 5)
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
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Bonjour, {student.first_name} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Voici un résumé de votre scolarité</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#7AB832]/30 bg-gradient-to-br from-[#1B3A6B] to-[#234a82] p-4 text-white shadow-md sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7AB832] shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">EduBot — ton assistant scolaire</p>
              <p className="mt-0.5 text-sm text-white/80">
                Explications, astuces de révision et méthodes de travail, dans le cadre de ton école.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 bg-[#7AB832] hover:bg-[#6aa32b] text-white">
            <Link href="/eleve/tuteur">
              Discuter avec EduBot
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <Card>
          <CardContent className="flex flex-col items-center px-2 py-3 sm:py-4">
            <BookOpen className="mb-1 h-5 w-5 text-[#1B3A6B] sm:h-6 sm:w-6" />
            <p className="text-xl font-bold text-[#1B3A6B] sm:text-2xl">
              {displayedAverage !== null ? displayedAverage.toFixed(1) : '—'}
            </p>
            <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">
              {bulletinAverage !== null ? 'Moy. bulletin' : 'Moyenne publiée'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center px-2 py-3 sm:py-4">
            <UserX className="mb-1 h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
            <p className="text-xl font-bold text-orange-500 sm:text-2xl">{absenceCount ?? 0}</p>
            <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">Absences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center px-2 py-3 sm:py-4">
            <FileText className="mb-1 h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
            <p className="text-xl font-bold text-green-600 sm:text-2xl">{bulletinCount ?? 0}</p>
            <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">Bulletins</p>
          </CardContent>
        </Card>
      </div>

      {recentGrades.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">Dernières notes publiées</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
              <Link href="/eleve/notes">
                Tout voir
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGrades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="text-gray-700">{grade.subjectName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{grade.slotLabel}</span>
                </div>
                <span className="shrink-0 font-semibold text-[#1B3A6B]">
                  {grade.value.toFixed(2).replace(/\.?0+$/, '')} / 20
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
