import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canAccessAdmissionArchives } from '@/lib/admissions/access'
import { getRefusedAdmissions } from '@/lib/admissions/queries'
import { PageHeader } from '@/components/dashboard/page-header'
import { AdmissionArchivedTable } from '@/features/admissions/admission-archived-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Archives admissions refusées',
}

export default async function AdmissionsArchivedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!canAccessAdmissionArchives(ctx.role_code)) redirect('/dashboard')

  const dossiers = await getRefusedAdmissions(ctx.school_id)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Archives — admissions refusées"
        description={`${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''} refusé${dossiers.length > 1 ? 's' : ''} définitivement. Consultez le motif et imprimez l'avis guichet pour le parent.`}
      />
      <AdmissionArchivedTable dossiers={dossiers} />
    </div>
  )
}
