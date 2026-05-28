'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateStudentCourses() {
  revalidatePath('/eleve/cours')
}
