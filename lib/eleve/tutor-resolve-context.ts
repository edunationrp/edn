import { createClient } from '@/lib/supabase/server'
import { getStudentTutorContext } from '@/lib/eleve/tutor-context'
import { PUBLIC_TUTOR_CONTEXT, type TutorContextBase } from '@/lib/eleve/tutor-types'

export async function resolveTutorContext(): Promise<TutorContextBase> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return PUBLIC_TUTOR_CONTEXT
  }

  const studentCtx = await getStudentTutorContext(user.id)
  if (!studentCtx) {
    return PUBLIC_TUTOR_CONTEXT
  }

  return {
    firstName: studentCtx.firstName,
    className: studentCtx.className,
    schoolName: studentCtx.schoolName,
    subjects: studentCtx.subjects,
    recentGrades: studentCtx.recentGrades,
    isAuthenticated: true,
  }
}
