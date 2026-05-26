import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminDashboard } from '@/features/dashboard/super-admin-dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Super Admin — EduNation',
}

export default async function PlatformOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .limit(1)

  const profile = (profileRaw as Array<{ full_name: string | null }> | null)?.[0]
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  return <SuperAdminDashboard userName={firstName} />
}
