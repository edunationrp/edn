import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { TimetableWeekView } from '@/features/timetable/timetable-week-view'
import { canManageTimetable, canRequestTimetableChange } from '@/lib/timetable/access'
import {
  getActiveSchoolYearId,
  getSchoolTimetableSlots,
  getTeacherTimetableSlots,
  getTimetableChangeRequests,
  getTimetablePageMeta,
} from '@/lib/timetable/data'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Emploi du temps — EduNation',
}

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id
  const role = ctx?.role_code as UserRole | undefined

  if (!schoolId || !role || !hasPermission(role, 'timetable:read')) {
    redirect('/dashboard')
  }

  const schoolYearId = await getActiveSchoolYearId(supabase, schoolId)
  if (!schoolYearId) {
    return (
      <DashboardPage>
        <EmptyPanel
          title="Aucune année scolaire active"
          description="Activez une année scolaire avant de publier l’emploi du temps."
        />
      </DashboardPage>
    )
  }

  const [schoolSlots, teacherSlots, requests, meta] = await Promise.all([
    getSchoolTimetableSlots(schoolId, schoolYearId),
    role === 'PROFESSEUR'
      ? getTeacherTimetableSlots(schoolId, schoolYearId, user.id)
      : Promise.resolve([]),
    getTimetableChangeRequests(schoolId, role === 'PROFESSEUR' ? user.id : undefined),
    getTimetablePageMeta(schoolId, schoolYearId),
  ])

  return (
    <DashboardPage>
      <TimetableWeekView
        schoolSlots={schoolSlots}
        teacherSlots={teacherSlots}
        requests={requests}
        meta={meta}
        canManage={canManageTimetable(role)}
        canRequestChanges={canRequestTimetableChange(role)}
      />
    </DashboardPage>
  )
}
