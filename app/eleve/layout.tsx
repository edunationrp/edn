import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from '@/components/eleve/student-shell'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'

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

  const { count: unreadNotifications } = await excludeMessagingNotificationTypes(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('notifications')
      .select('id, title, body, type, is_read, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false),
  )

  const { data: recentNotificationsRaw } = await excludeMessagingNotificationTypes(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('notifications')
      .select('id, title, body, type, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  )

  return (
    <StudentShell
      userId={user.id}
      studentName={`${student.first_name} ${student.last_name}`}
      iun={student.iun}
      className={className}
      schoolName={school?.name ?? ''}
      schoolYear={schoolYear}
      schoolLogoUrl={school?.logo_url ?? null}
      schoolWatermarkOpacity={school?.logo_watermark_opacity ?? null}
      notifications={(recentNotificationsRaw ?? []) as Array<{
        id: string
        title: string
        body: string
        type: string
        is_read: boolean
        created_at: string
      }>}
      unreadNotifications={unreadNotifications ?? 0}
    >
      {children}
    </StudentShell>
  )
}
