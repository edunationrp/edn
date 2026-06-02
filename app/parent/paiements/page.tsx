import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import { ParentFinanceView } from '@/features/parent/parent-finance-view'
import { getParentStudentFinanceSummary } from '@/lib/finance/parent-student-finance'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paiements — Espace parent' }

export default async function ParentPaiementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Paiements" />
  }

  const summary = await getParentStudentFinanceSummary(activeChild.schoolId, activeChild.studentId)
  if (!summary) {
    return <ParentNoChildState title="Paiements" />
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Paiements</h1>
        <p className="text-sm text-muted-foreground">
          {activeChild.fullName} · {activeChild.schoolName}
        </p>
      </div>

      <ParentFinanceView summary={summary} />
    </div>
  )
}
