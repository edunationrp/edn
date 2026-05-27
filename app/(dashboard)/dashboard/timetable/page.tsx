import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { TimetableWeekView } from '@/features/timetable/timetable-week-view'
import { canManageTimetable, canRequestTimetableChange } from '@/lib/timetable/access'
import {
  getActiveSchoolYearId,
  getCalendarEvents,
  getSchoolStaffAssignments,
  getSchoolTeachers,
  getSchoolTimetableSlots,
  getTeacherTimetableSlots,
  getTimetableBreaks,
  getTimetableChangeRequests,
  getTimetableClasses,
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

  const isManager = canManageTimetable(role)
  const isTeacher = canRequestTimetableChange(role)

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name, logo_url, logo_watermark_opacity')
    .eq('id', schoolId)
    .maybeSingle()

  const school = schoolRaw as {
    name: string
    logo_url: string | null
    logo_watermark_opacity: number | null
  } | null

  const [schoolSlots, teacherSlots, requests, meta, classes, staffAssignments, breaks, calendarEvents, teachers] = await Promise.all([
    getSchoolTimetableSlots(schoolId, schoolYearId),
    isTeacher ? getTeacherTimetableSlots(schoolId, schoolYearId, user.id) : Promise.resolve([]),
    getTimetableChangeRequests(schoolId, isTeacher ? user.id : undefined),
    getTimetablePageMeta(schoolId, schoolYearId),
    getTimetableClasses(schoolId, schoolYearId),
    isManager ? getSchoolStaffAssignments(schoolId) : Promise.resolve([]),
    getTimetableBreaks(schoolId, schoolYearId),
    getCalendarEvents(schoolId, schoolYearId),
    getSchoolTeachers(schoolId),
  ])

  return (
    <DashboardPage>
      <TimetableWeekView
        schoolSlots={schoolSlots}
        teacherSlots={teacherSlots}
        requests={requests}
        classes={classes}
        staffAssignments={staffAssignments}
        breaks={breaks}
        calendarEvents={calendarEvents}
        teachers={teachers}
        meta={meta}
        schoolName={school?.name ?? 'Établissement scolaire'}
        schoolLogoUrl={school?.logo_url ?? null}
        schoolWatermarkOpacity={school?.logo_watermark_opacity ?? null}
        canManage={isManager}
        canRequestChanges={isTeacher}
        emptyTitle={isManager ? 'Aucun cours planifié pour cette classe' : 'Aucun créneau planifié'}
        emptyDescription={
          isManager
            ? 'Ajoutez des créneaux avec le bouton « Ajouter une matière » ou en cliquant sur une case libre.'
            : 'L’emploi du temps officiel apparaîtra ici une fois publié par le censeur.'
        }
      />
    </DashboardPage>
  )
}
