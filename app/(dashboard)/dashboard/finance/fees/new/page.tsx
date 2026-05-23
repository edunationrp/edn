import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { FeeStructureForm } from '@/features/finance/fee-structure-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouvelle structure tarifaire' }

export default async function NewFeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: yearsRaw } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .limit(1)

  const schoolYear = (yearsRaw as Array<{ id: string; name: string }> | null)?.[0]
  if (!schoolYear) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-medium">Aucune année scolaire active</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader title="Structure tarifaire" description={`Année ${schoolYear.name}`} />
      <FeeStructureForm schoolId={ctx.school_id} schoolYearId={schoolYear.id} />
    </div>
  )
}
