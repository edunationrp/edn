import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { PageHeader } from '@/components/dashboard/page-header'
import { StaffAnnouncementsPanel } from '@/features/announcements/staff-announcements-panel'
import {
  getSchoolClassesForAnnouncements,
  getStaffAnnouncements,
} from '@/lib/announcements/staff-queries'

export const metadata: Metadata = { title: 'Annonces' }
export const dynamic = 'force-dynamic'

export default async function StaffAnnouncementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'announcements:create')) {
    redirect('/dashboard')
  }

  const [announcements, classes] = await Promise.all([
    getStaffAnnouncements(ctx.school_id),
    getSchoolClassesForAnnouncements(ctx.school_id),
  ])

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Annonces"
        description="Diffusez des actualités, événements et documents aux parents — sans syntaxe markdown."
      />
      <StaffAnnouncementsPanel
        schoolId={ctx.school_id}
        announcements={announcements}
        classes={classes}
      />
    </div>
  )
}
