import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentPortalLayout } from '@/components/eleve/student-portal-layout'

export default async function EleveTuteurLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login/eleve')

  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!studentRow) redirect('/login/eleve')

  return <StudentPortalLayout>{children}</StudentPortalLayout>
}
