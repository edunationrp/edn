import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PromotionStructureClient } from '@/features/promotions/promotion-structure-client'
import { getPromotionStructureSetup, getPromotionClassMappings } from '@/lib/actions/promotion-structure'
import { canManagePromotions, canViewPromotions } from '@/lib/promotions/access'
import type { UserRole } from '@/types/roles'

export const metadata = {
  title: 'Préparer la rentrée — EduNation',
}

export default async function PromotionStructurePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  if (!canViewPromotions(role)) redirect('/dashboard')

  const setup = await getPromotionStructureSetup(sessionId)
  if ('error' in setup) {
    return (
      <DashboardPage>
        <p className="text-sm text-destructive">{setup.error}</p>
      </DashboardPage>
    )
  }

  let initialMappings = null
  if (setup.structureReady && setup.targetYearId) {
    const mappings = await getPromotionClassMappings(sessionId)
    if (!('error' in mappings)) {
      initialMappings = {
        rows: mappings.rows,
        targetOptions: mappings.targetOptions,
        allMapped: mappings.allMapped,
        warningCount: mappings.warningCount,
      }
    }
  }

  return (
    <DashboardPage>
      <PromotionStructureClient
        setup={setup}
        initialMappings={initialMappings}
        canManage={canManagePromotions(role)}
      />
    </DashboardPage>
  )
}
