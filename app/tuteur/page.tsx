import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentTutorContext } from '@/lib/eleve/tutor-context'

export const metadata: Metadata = {
  title: 'EduBot — Assistant scolaire | EduNation',
  description: 'Assistant IA pour élèves connectés : explications, révisions et astuces.',
}

export default async function TuteurPublicPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const studentCtx = user ? await getStudentTutorContext(user.id) : null

  if (studentCtx) {
    redirect('/eleve/tuteur')
  }

  redirect('/login/eleve')
}
