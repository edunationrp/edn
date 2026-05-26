import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { TuitionConfigPanel } from '@/features/finance/tuition-config-panel'
import { buildTuitionGrid } from '@/lib/finance/tuition-grid'
import { canConfigureOfficialTuition } from '@/lib/finance/access'
import { getExtraFeeTemplates } from '@/lib/actions/extra-fees'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs officiels',
}

export default async function OfficialTuitionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!canConfigureOfficialTuition(ctx.role_code)) redirect('/dashboard')

  const { data: yearsRaw } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .limit(1)

  const schoolYear = (yearsRaw as Array<{ id: string; name: string }> | null)?.[0]
  if (!schoolYear) {
    return (
      <div className="py-12 text-center">
        <p className="font-medium">Aucune année scolaire active.</p>
      </div>
    )
  }

  const [levelsResult, ratesResult, extraTemplates] = await Promise.all([
    supabase
      .from('class_levels')
      .select('id, name')
      .eq('school_id', ctx.school_id)
      .order('order_num'),
    supabase
      .from('official_tuition_rates')
      .select('id, class_level_id, series, amount')
      .eq('school_id', ctx.school_id)
      .eq('school_year_id', schoolYear.id)
      .eq('is_active', true),
    getExtraFeeTemplates(ctx.school_id),
  ])

  const levels = (levelsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const rates =
    (ratesResult.data as Array<{
      id: string
      class_level_id: string
      series: string
      amount: number
    }> | null) ?? []

  const grid = buildTuitionGrid(levels, rates)

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <PageHeader
        title="Configuration financière"
        description="Tarifs officiels de scolarité et catalogue des frais supplémentaires pour l'intendant"
      />
      <TuitionConfigPanel
        schoolYearId={schoolYear.id}
        schoolYearName={schoolYear.name}
        grid={grid}
        extraTemplates={extraTemplates}
      />
    </div>
  )
}
