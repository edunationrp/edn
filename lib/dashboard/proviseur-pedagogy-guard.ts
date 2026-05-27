import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { isProviseurPedagogyExcluded } from '@/lib/dashboard/role-scope'

/** Redirige le proviseur hors des pages notes / bulletins / absences. */
export async function assertProviseurNotInPedagogy() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (ctx && isProviseurPedagogyExcluded(ctx.role_code)) {
    redirect('/dashboard')
  }
}
