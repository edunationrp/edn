'use server'

import { revalidatePath } from 'next/cache'
import { notifyClassStudents } from '@/lib/notifications/notify-students'

export async function revalidateStudentCourses() {
  revalidatePath('/eleve/cours')
}

export async function notifyStudentsCoursePublished(input: {
  schoolId: string
  classId: string
  title: string
  subjectName: string
}) {
  await notifyClassStudents({
    schoolId: input.schoolId,
    classId: input.classId,
    title: 'Nouveau cours publié',
    body: `${input.title} — ${input.subjectName} est disponible dans vos ressources.`,
    type: 'course',
    actionPath: '/eleve/cours',
  })
  revalidatePath('/eleve')
  revalidatePath('/eleve/cours')
}
