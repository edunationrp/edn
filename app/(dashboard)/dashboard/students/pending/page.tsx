import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canAccessStudentRegistry } from '@/lib/students/registry-access'
import { hasPermission } from '@/types/permissions'

/** Ancienne route — redirige vers le bon module selon le rôle. */
export default async function PendingStudentsRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  if (!canAccessStudentRegistry(ctx.role_code)) {
    redirect('/dashboard')
  }

  if (hasPermission(ctx.role_code, 'students:validate')) {
    redirect('/dashboard/admissions/to-validate')
  }

  if (hasPermission(ctx.role_code, 'students:update')) {
    redirect('/dashboard/admissions/to-process')
  }

  redirect('/dashboard/students')
}
