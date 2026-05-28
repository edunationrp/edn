'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

type NotifyStudentInput = {
  userId: string
  schoolId: string
  title: string
  body: string
  type: string
  actionPath?: string
}

export async function notifyStudent(input: NotifyStudentInput) {
  return dispatchNotification({
    ...input,
    sendEmail: false,
  })
}

type NotifyClassStudentsInput = {
  schoolId: string
  classId: string
  title: string
  body: string
  type: string
  actionPath?: string
}

export async function notifyClassStudents(input: NotifyClassStudentsInput) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const { data: enrollmentsRaw } = await admin
    .from('student_enrollments')
    .select('students(user_id)')
    .eq('class_id', input.classId)
    .eq('status', 'active')

  const userIds = new Set<string>()
  for (const row of (enrollmentsRaw ?? []) as Array<{ students: { user_id: string | null } | null }>) {
    const userId = row.students?.user_id
    if (userId) userIds.add(userId)
  }

  await Promise.all(
    [...userIds].map(userId =>
      dispatchNotification({
        userId,
        schoolId: input.schoolId,
        title: input.title,
        body: input.body,
        type: input.type,
        actionPath: input.actionPath,
        sendEmail: false,
      }),
    ),
  )

  return { success: true, count: userIds.size }
}

type NotifySchoolYearStudentsInput = {
  schoolId: string
  schoolYearId: string
  title: string
  body: string
  type: string
  actionPath?: string
}

export async function notifySchoolYearStudents(input: NotifySchoolYearStudentsInput) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const { data: enrollmentsRaw } = await admin
    .from('student_enrollments')
    .select('students(user_id)')
    .eq('school_id', input.schoolId)
    .eq('school_year_id', input.schoolYearId)
    .eq('status', 'active')

  const userIds = new Set<string>()
  for (const row of (enrollmentsRaw ?? []) as Array<{ students: { user_id: string | null } | null }>) {
    const userId = row.students?.user_id
    if (userId) userIds.add(userId)
  }

  await Promise.all(
    [...userIds].map(userId =>
      dispatchNotification({
        userId,
        schoolId: input.schoolId,
        title: input.title,
        body: input.body,
        type: input.type,
        actionPath: input.actionPath,
        sendEmail: false,
      }),
    ),
  )

  return { success: true, count: userIds.size }
}
