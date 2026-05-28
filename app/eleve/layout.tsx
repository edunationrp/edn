import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from '@/components/eleve/student-shell'

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  // Récupérer le dossier élève lié à cet auth user
  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id, iun, first_name, last_name, status, school_id,
      student_enrollments(
        class_id,
        classes(name),
        school_years(name, is_active)
      )
    `)
    .eq('user_id', user.id)
    .limit(1)

  const student = (studentRaw as any[] | null)?.[0]
  if (!student) redirect('/login/eleve')
  if (student.status === 'inactive') redirect('/login/eleve?error=inactive')

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('id, name, type, city, logo_url, logo_watermark_opacity')
    .eq('id', student.school_id)
    .single()

  const school = schoolRaw as {
    id: string
    name: string
    type: string
    city: string | null
    logo_url: string | null
    logo_watermark_opacity: number | null
  } | null

  const activeEnrollment = (student.student_enrollments as any[])?.find(
    (e: any) => e.school_years?.is_active
  )
  const className = activeEnrollment?.classes?.name ?? null
  const schoolYear = activeEnrollment?.school_years?.name ?? null

  return (
    <StudentShell
      studentName={`${student.first_name} ${student.last_name}`}
      iun={student.iun}
      className={className}
      schoolName={school?.name ?? ''}
      schoolYear={schoolYear}
      schoolLogoUrl={school?.logo_url ?? null}
      schoolWatermarkOpacity={school?.logo_watermark_opacity ?? null}
    >
      {children}
    </StudentShell>
  )
}
