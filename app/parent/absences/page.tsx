import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { getParentAbsenceRecords } from '@/lib/parent/attendance'
import { ParentAbsencesView } from '@/features/parent/parent-absences-view'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Absences — Espace parent' }
export const dynamic = 'force-dynamic'

export default async function ParentAbsencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Absences" />
  }

  const records = await getParentAbsenceRecords(activeChild.studentId)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Absences & retards</h1>
        <p className="text-sm text-muted-foreground">
          {activeChild.fullName} · {activeChild.schoolName}
        </p>
      </div>

      <ParentAbsencesView records={records} childName={activeChild.fullName} />
    </div>
  )
}
