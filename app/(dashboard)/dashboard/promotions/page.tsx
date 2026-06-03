import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { PageHeader } from '@/components/dashboard/page-header'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PromotionsHubClient } from '@/features/promotions/promotions-hub-client'
import { getPromotionSettings, listPromotionSessions } from '@/lib/actions/promotions'
import { canManagePromotions, canViewPromotions } from '@/lib/promotions/access'
import type { UserRole } from '@/types/roles'

export const metadata = {
  title: 'Passage fin d\'année — EduNation',
}

export default async function PromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  if (!canViewPromotions(role)) redirect('/dashboard')

  const [settingsResult, sessionsResult] = await Promise.all([
    getPromotionSettings(),
    listPromotionSessions(),
  ])

  if ('error' in settingsResult) {
    return (
      <DashboardPage>
        <PageHeader title="Passage fin d'année" description="Bilan de réussite (simulation)" />
        <p className="text-sm text-destructive">{settingsResult.error}</p>
      </DashboardPage>
    )
  }

  const sessions = 'error' in sessionsResult ? [] : sessionsResult.sessions

  return (
    <DashboardPage>
      <PageHeader
        title="Passage fin d'année"
        description="Calculez le bilan de réussite par classe selon la moyenne configurée. Aucun transfert d'inscription n'est effectué à cette étape."
      />
      <PromotionsHubClient
        passingAverage={settingsResult.passingAverage}
        averageRule={settingsResult.averageRule}
        sessions={sessions}
        canManage={canManagePromotions(role)}
      />
    </DashboardPage>
  )
}
