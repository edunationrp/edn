'use server'

import { revalidatePath } from 'next/cache'
import {
  canRequestTimetableChange,
  requireTimetableManage,
  requireTimetableRead,
} from '@/lib/timetable/access'
import { getActiveSchoolYearId } from '@/lib/timetable/data'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { notifyClassStudents, notifySchoolYearStudents } from '@/lib/notifications/notify-students'
import type { CalendarEventType } from '@/lib/timetable/types'

const TIMETABLE_PATH = '/dashboard/timetable'
const STUDENT_TIMETABLE_PATH = '/eleve/emploi-du-temps'
const STUDENT_HOME_PATH = '/eleve'

function revalidateTimetableViews() {
  revalidatePath(TIMETABLE_PATH)
  revalidatePath('/dashboard')
  revalidatePath(STUDENT_TIMETABLE_PATH)
  revalidatePath(STUDENT_HOME_PATH)
}

async function notifyClassTimetableUpdate(schoolId: string, classId: string, detail: string) {
  await notifyClassStudents({
    schoolId,
    classId,
    title: 'Emploi du temps modifié',
    body: detail,
    type: 'timetable',
    actionPath: STUDENT_TIMETABLE_PATH,
  })
  revalidatePath(STUDENT_HOME_PATH)
}

async function notifySchoolTimetableBreaksUpdate(schoolId: string, schoolYearId: string) {
  await notifySchoolYearStudents({
    schoolId,
    schoolYearId,
    title: 'Emploi du temps mis à jour',
    body: 'Les pauses ou horaires de l\'établissement ont été modifiés. Consultez votre emploi du temps.',
    type: 'timetable',
    actionPath: STUDENT_TIMETABLE_PATH,
  })
  revalidatePath(STUDENT_HOME_PATH)
}

type SlotTimeInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
  description?: string | null
}

function normalizeTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
}

function validateSlotTime(input: SlotTimeInput): string | null {
  if (input.dayOfWeek < 1 || input.dayOfWeek > 7) {
    return 'Jour invalide.'
  }
  const start = normalizeTime(input.startTime)
  const end = normalizeTime(input.endTime)
  if (!start || !end) return 'Format horaire invalide (HH:MM).'
  if (start >= end) return 'L\'heure de fin doit être après l\'heure de début.'
  return null
}

export async function updateTimetableSlot(slotId: string, input: SlotTimeInput) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  const validationError = validateSlotTime(input)
  if (validationError) return { error: validationError }

  const { supabase, schoolId } = access
  const startTime = normalizeTime(input.startTime)!
  const endTime = normalizeTime(input.endTime)!

  const { data: slotRaw } = await supabase
    .from('timetable_slots')
    .select('id, school_id, class_id')
    .eq('id', slotId)
    .eq('school_id', schoolId)
    .maybeSingle()

  const slot = slotRaw as { id: string; school_id: string; class_id: string } | null
  if (!slot) return { error: 'Créneau introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('timetable_slots')
    .update({
      day_of_week: input.dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room: input.room?.trim() || null,
      description: input.description?.trim() || null,
    })
    .eq('id', slotId)
    .eq('school_id', schoolId)

  if (error) return { error: error.message }

  if (slot.class_id) {
    await notifyClassTimetableUpdate(
      schoolId,
      slot.class_id,
      'Un créneau de cours de votre classe a été modifié.',
    )
  }

  revalidateTimetableViews()
  return { success: true }
}

export async function createTimetableSlot(input: {
  classId: string
  subjectId: string
  teacherId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
  description?: string | null
}) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  const validationError = validateSlotTime(input)
  if (validationError) return { error: validationError }

  const { supabase, schoolId } = access
  const schoolYearId = await getActiveSchoolYearId(supabase, schoolId)
  if (!schoolYearId) return { error: 'Aucune année scolaire active.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('timetable_slots').insert({
    school_id: schoolId,
    school_year_id: schoolYearId,
    class_id: input.classId,
    subject_id: input.subjectId,
    teacher_id: input.teacherId,
    day_of_week: input.dayOfWeek,
    start_time: normalizeTime(input.startTime)!,
    end_time: normalizeTime(input.endTime)!,
    room: input.room?.trim() || null,
    description: input.description?.trim() || null,
  })

  if (error) return { error: error.message }

  await notifyClassTimetableUpdate(
    schoolId,
    input.classId,
    'Un nouveau cours a été ajouté à l\'emploi du temps de votre classe.',
  )

  revalidateTimetableViews()
  return { success: true }
}

export async function createTimetableChangeRequest(slotId: string, input: SlotTimeInput & { reason: string }) {
  const access = await requireTimetableRead()
  if ('error' in access) return { error: access.error }
  if (!canRequestTimetableChange(access.role)) {
    return { error: 'Seuls les professeurs peuvent demander une modification.' }
  }

  const reason = input.reason.trim()
  if (reason.length < 8) {
    return { error: 'Ajoutez un motif clair pour le censeur.' }
  }

  const validationError = validateSlotTime(input)
  if (validationError) return { error: validationError }

  const { supabase, userId, schoolId } = access
  const { data: slotRaw } = await supabase
    .from('timetable_slots')
    .select('id, school_id, teacher_id')
    .eq('id', slotId)
    .eq('school_id', schoolId)
    .eq('teacher_id', userId)
    .maybeSingle()

  const slot = slotRaw as { id: string; school_id: string; teacher_id: string | null } | null
  if (!slot) return { error: 'Vous pouvez demander une modification uniquement sur vos créneaux.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('timetable_change_requests').insert({
    school_id: schoolId,
    timetable_slot_id: slotId,
    teacher_id: userId,
    requested_day_of_week: input.dayOfWeek,
    requested_start_time: normalizeTime(input.startTime)!,
    requested_end_time: normalizeTime(input.endTime)!,
    requested_room: input.room?.trim() || null,
    reason,
  })
  if (error) return { error: error.message }

  revalidateTimetableViews()
  return { success: true }
}

export async function deleteTimetableSlot(slotId: string) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  const { supabase, schoolId } = access

  const { data: slotRaw } = await supabase
    .from('timetable_slots')
    .select('class_id')
    .eq('id', slotId)
    .eq('school_id', schoolId)
    .maybeSingle()

  const slotMeta = slotRaw as { class_id: string } | null

  const { error } = await supabase
    .from('timetable_slots')
    .delete()
    .eq('id', slotId)
    .eq('school_id', schoolId)

  if (error) return { error: error.message }

  if (slotMeta?.class_id) {
    await notifyClassTimetableUpdate(
      schoolId,
      slotMeta.class_id,
      'Un créneau a été retiré de l\'emploi du temps de votre classe.',
    )
  }

  revalidateTimetableViews()
  return { success: true }
}

export async function reviewTimetableChangeRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewNote?: string,
) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  const { supabase, userId, schoolId } = access
  const { data: requestRaw } = await supabase
    .from('timetable_change_requests')
    .select(`
      id, school_id, teacher_id, timetable_slot_id, requested_day_of_week,
      requested_start_time, requested_end_time, requested_room, status
    `)
    .eq('id', requestId)
    .eq('school_id', schoolId)
    .maybeSingle()

  const request = requestRaw as {
    id: string
    teacher_id: string
    timetable_slot_id: string | null
    requested_day_of_week: number
    requested_start_time: string
    requested_end_time: string
    requested_room: string | null
    status: string
  } | null

  if (!request) return { error: 'Demande introuvable.' }
  if (request.status !== 'pending') return { error: 'Cette demande a déjà été traitée.' }

  if (decision === 'approved') {
    if (!request.timetable_slot_id) return { error: 'Aucun créneau à modifier.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: slotError } = await (supabase as any)
      .from('timetable_slots')
      .update({
        day_of_week: request.requested_day_of_week,
        start_time: request.requested_start_time,
        end_time: request.requested_end_time,
        room: request.requested_room,
      })
      .eq('id', request.timetable_slot_id)
      .eq('school_id', schoolId)

    if (slotError) return { error: slotError.message }

    const { data: slotRaw } = await supabase
      .from('timetable_slots')
      .select('class_id')
      .eq('id', request.timetable_slot_id)
      .maybeSingle()

    const approvedSlot = slotRaw as { class_id: string } | null
    if (approvedSlot?.class_id) {
      await notifyClassTimetableUpdate(
        schoolId,
        approvedSlot.class_id,
        'L\'emploi du temps de votre classe a été mis à jour.',
      )
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('timetable_change_requests')
    .update({
      status: decision,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote?.trim() || null,
    })
    .eq('id', requestId)
    .eq('school_id', schoolId)

  if (error) return { error: error.message }

  await dispatchNotification({
    userId: request.teacher_id,
    schoolId,
    title: decision === 'approved' ? 'Demande d\'emploi du temps approuvée' : 'Demande d\'emploi du temps refusée',
    body: decision === 'approved'
      ? 'Votre demande de modification a été acceptée par le censeur.'
      : 'Votre demande de modification a été refusée. Consultez l\'emploi du temps pour le détail.',
    type: 'timetable_request',
    actionPath: '/dashboard/timetable',
  })

  revalidateTimetableViews()
  return { success: true }
}

export async function saveTimetableBreaks(
  breaks: Array<{ label: string; breakType: 'pause' | 'lunch'; startTime: string; endTime: string; orderNum: number }>,
) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  const { supabase, schoolId } = access
  const schoolYearId = await getActiveSchoolYearId(supabase, schoolId)
  if (!schoolYearId) return { error: 'Aucune année scolaire active.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from('timetable_breaks').delete().eq('school_id', schoolId).eq('school_year_id', schoolYearId)

  if (breaks.length === 0) {
    revalidateTimetableViews()
    return { success: true }
  }

  const rows = breaks.map((item, index) => ({
    school_id: schoolId,
    school_year_id: schoolYearId,
    label: item.label,
    break_type: item.breakType,
    start_time: normalizeTime(item.startTime)!,
    end_time: normalizeTime(item.endTime)!,
    order_num: item.orderNum ?? index,
  }))

  const { error } = await db.from('timetable_breaks').insert(rows)
  if (error) return { error: error.message }

  await notifySchoolTimetableBreaksUpdate(schoolId, schoolYearId)

  revalidateTimetableViews()
  return { success: true }
}

export async function createCalendarEvent(input: {
  eventType: CalendarEventType
  title: string
  description?: string | null
  eventDate: string
  endDate?: string | null
  allDay?: boolean
  startTime?: string | null
  endTime?: string | null
  classId?: string | null
  subjectId?: string | null
  teacherId?: string | null
  room?: string | null
}) {
  const access = await requireTimetableRead()
  if ('error' in access) return { error: access.error }

  const title = input.title.trim()
  if (title.length < 2) return { error: 'Titre requis.' }

  const { supabase, userId, schoolId } = access
  const schoolYearId = await getActiveSchoolYearId(supabase, schoolId)
  if (!schoolYearId) return { error: 'Aucune année scolaire active.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('calendar_events').insert({
    school_id: schoolId,
    school_year_id: schoolYearId,
    event_type: input.eventType,
    title,
    description: input.description?.trim() || null,
    event_date: input.eventDate,
    end_date: input.endDate || null,
    all_day: input.allDay ?? true,
    start_time: input.startTime ? normalizeTime(input.startTime) : null,
    end_time: input.endTime ? normalizeTime(input.endTime) : null,
    class_id: input.classId || null,
    subject_id: input.subjectId || null,
    teacher_id: input.teacherId || null,
    room: input.room?.trim() || null,
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidateTimetableViews()
  return { success: true }
}

export async function updateCalendarEvent(
  eventId: string,
  input: {
    eventType: CalendarEventType
    title: string
    description?: string | null
    eventDate: string
    endDate?: string | null
    allDay?: boolean
    startTime?: string | null
    endTime?: string | null
    classId?: string | null
    subjectId?: string | null
    teacherId?: string | null
    room?: string | null
  },
) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  const title = input.title.trim()
  if (title.length < 2) return { error: 'Titre requis.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('calendar_events')
    .update({
      event_type: input.eventType,
      title,
      description: input.description?.trim() || null,
      event_date: input.eventDate,
      end_date: input.endDate || null,
      all_day: input.allDay ?? true,
      start_time: input.startTime ? normalizeTime(input.startTime) : null,
      end_time: input.endTime ? normalizeTime(input.endTime) : null,
      class_id: input.classId || null,
      subject_id: input.subjectId || null,
      teacher_id: input.teacherId || null,
      room: input.room?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }
  revalidateTimetableViews()
  return { success: true }
}

export async function deleteCalendarEvent(eventId: string) {
  const access = await requireTimetableManage()
  if ('error' in access) return { error: access.error }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }
  revalidateTimetableViews()
  return { success: true }
}

export async function deleteOwnTimetableSlot(slotId: string) {
  void slotId
  return { error: 'Le professeur doit envoyer une demande au censeur.' }
}
