import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PromotionSessionClient } from '@/features/promotions/promotion-session-client'
import { getPromotionSessionDetail } from '@/lib/actions/promotions'
import { canManagePromotions, canViewPromotions } from '@/lib/promotions/access'
import type { UserRole } from '@/types/roles'

export const metadata = {
  title: 'Bilan de passage — EduNation',
}

export default async function PromotionSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ class?: string }>
}) {
  const { sessionId } = await params
  const { class: classFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  if (!canViewPromotions(role)) redirect('/dashboard')

  const detail = await getPromotionSessionDetail(sessionId, classFilter)
  if ('error' in detail) {
    return (
      <DashboardPage>
        <p className="text-sm text-destructive">{detail.error}</p>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage>
      <PromotionSessionClient
        session={detail.session}
        classSummaries={detail.classSummaries}
        classOptions={detail.classOptions}
        students={detail.students}
        schoolSummary={detail.schoolSummary}
        canManage={canManagePromotions(role)}
      />
    </DashboardPage>
  )
}
