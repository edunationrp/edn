'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

type NotifyAnnouncementInput = {
  schoolId: string
  targetType: 'all' | 'parents' | 'class'
  targetId?: string | null
  title: string
  body: string
  isUpdate?: boolean
}

type RelationRow = {
  parent_user_id: string
  students: {
    school_id: string
    student_enrollments: Array<{
      class_id: string | null
      status: string
      school_years: { is_active: boolean } | null
    }> | null
  } | null
}

export async function notifyParentsOfAnnouncement(input: NotifyAnnouncementInput) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' as const }
  }

  const { data: relationsRaw } = await admin
    .from('parent_student_relations')
    .select(`
      parent_user_id,
      students!inner(
        school_id,
        student_enrollments(class_id, status, school_years(is_active))
      )
    `)
    .eq('students.school_id', input.schoolId)

  const parentIds = new Set<string>()

  for (const row of (relationsRaw ?? []) as RelationRow[]) {
    const student = row.students
    if (!student) continue

    const enrollments = student.student_enrollments ?? []
    const activeEnrollment =
      enrollments.find(e => e.school_years?.is_active && e.status === 'active') ?? enrollments[0]

    if (input.targetType === 'class' && input.targetId) {
      if (activeEnrollment?.class_id !== input.targetId) continue
    }

    parentIds.add(row.parent_user_id)
  }

  const prefix = input.isUpdate ? 'Annonce modifiée' : 'Nouvelle annonce'
  const summary = input.body.trim() || 'Consultez l\'annonce dans vos communications.'

  await Promise.all(
    [...parentIds].map(parentUserId =>
      dispatchNotification({
        userId: parentUserId,
        schoolId: input.schoolId,
        title: `${prefix} : ${input.title}`,
        body: summary.slice(0, 200),
        type: 'announcement',
        actionPath: '/parent/communications',
        sendEmail: false,
      }),
    ),
  )

  return { success: true as const, notified: parentIds.size }
}
