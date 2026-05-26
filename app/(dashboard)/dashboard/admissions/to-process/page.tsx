import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import { PageHeader } from '@/components/dashboard/page-header'
import { getSecretaryQueue } from '@/lib/admissions/queries'
import { AdmissionQueueTable } from '@/features/admissions/admission-queue-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dossiers à traiter',
}

export default async function AdmissionsToProcessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!hasPermission(ctx.role_code, 'students:update')) redirect('/dashboard')

  const dossiers = await getSecretaryQueue(ctx.school_id)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Dossiers à traiter"
        description={`${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''} à compléter ou soumettre au proviseur`}
      />
      <AdmissionQueueTable dossiers={dossiers} mode="secretary" />
    </div>
  )
}
