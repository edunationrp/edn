import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchPublishedFamilyBulletins } from '@/lib/report-cards/family-bulletins'
import { sortBulletinsForDisplay } from '@/lib/report-cards/bulletin-evolution'
import { StudentBulletinsEvolution } from '@/features/eleve/student-bulletins-evolution'
import { StudentBulletinsList } from '@/features/eleve/student-bulletins-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes bulletins — EduNation' }

export default async function EleveBulletinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id, school_id,
      student_enrollments(classes(name), school_years(is_active))
    `)
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as {
    id: string
    school_id: string
    student_enrollments: Array<{
      classes: { name: string } | null
      school_years: { is_active: boolean } | null
    }>
  } | null
  if (!student) redirect('/login/eleve')

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name, logo_url')
    .eq('id', student.school_id)
    .single()

  const school = schoolRaw as { name: string; logo_url: string | null } | null

  const bulletinsRaw = await fetchPublishedFamilyBulletins(supabase, student.id)

  const bulletins = sortBulletinsForDisplay(
    bulletinsRaw.map(bulletin => ({
    id: bulletin.id,
    period: bulletin.period,
    term: bulletin.term,
    average: bulletin.average,
    rank: bulletin.rank,
    class_size: bulletin.class_size,
    schoolYearName: bulletin.school_years?.name ?? null,
    snapshot: bulletin.snapshot_json!,
    })),
  )

  const schoolYears = new Set(bulletins.map(b => b.schoolYearName).filter(Boolean))

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes bulletins</h1>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">
          Bulletins officiels publiés par ton établissement. Ouvre chaque trimestre pour le
          document complet, l&apos;impression ou le téléchargement.
        </p>
        {bulletins.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {bulletins.length} bulletin{bulletins.length !== 1 ? 's' : ''} publié
            {bulletins.length !== 1 ? 's' : ''}
            {schoolYears.size > 0 && ` · ${[...schoolYears].join(', ')}`}
          </p>
        )}
      </div>

      <StudentBulletinsEvolution bulletins={bulletins} />
      <StudentBulletinsList bulletins={bulletins} schoolLogoUrl={school?.logo_url} />
    </div>
  )
}
