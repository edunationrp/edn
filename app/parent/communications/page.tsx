import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import {
  getParentAnnouncements,
  getParentConvocations,
  getParentMeetings,
} from '@/lib/parent/communications'
import { ParentCommunicationsView } from '@/features/parent/parent-communications-view'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Communications — Espace parent' }
export const dynamic = 'force-dynamic'

export default async function ParentCommunicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Communications" />
  }

  const [announcements, meetings, convocations] = await Promise.all([
    getParentAnnouncements(activeChild.schoolId, activeChild.classId, user.id, activeChild.studentId),
    getParentMeetings(activeChild.schoolId, activeChild.classId, user.id, activeChild.studentId),
    getParentConvocations(user.id, activeChild.studentId),
  ])

  return (
    <ParentCommunicationsView
      studentId={activeChild.studentId}
      announcements={announcements}
      meetings={meetings}
      convocations={convocations}
      schoolName={activeChild.schoolName}
      childName={activeChild.fullName}
    />
  )
}
