'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateStudentStatus(
  studentId: string,
  status: 'active' | 'rejected'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expirée. Reconnectez-vous.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('students')
    .update({ status })
    .eq('id', studentId)

  if (error) {
    return { error: error.message }
  }

  if (status === 'active') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollmentError } = await (supabase as any)
      .from('student_enrollments')
      .update({ status: 'active' })
      .eq('student_id', studentId)

    if (enrollmentError) {
      return { error: enrollmentError.message }
    }
  }

  revalidatePath('/dashboard/students/pending')
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard')

  return { success: true }
}
