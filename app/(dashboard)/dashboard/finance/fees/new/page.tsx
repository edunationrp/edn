import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canConfigureOfficialTuition } from '@/lib/finance/access'

export default async function NewFeePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  if (canConfigureOfficialTuition(ctx.role_code)) {
    redirect('/dashboard/finance/tuition')
  }

  redirect('/dashboard/finance')
}
