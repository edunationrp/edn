import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentTutorContext } from '@/lib/eleve/tutor-context'
import { isTutorAiConfigured } from '@/lib/eleve/tutor-openai'
import { listTutorConversations } from '@/lib/actions/student-tutor'
import { TutorChatClient } from '@/features/tuteur/tutor-chat-client'

export const metadata: Metadata = {
  title: 'EduBot — Assistant scolaire',
  description: 'Ton assistant IA pour réviser et comprendre tes cours',
}

export default async function EleveTuteurPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const ctx = await getStudentTutorContext(user.id)
  if (!ctx) redirect('/login/eleve')

  const { conversations } = await listTutorConversations()

  return (
    <TutorChatClient
      mode="student"
      embedded
      firstName={ctx.firstName}
      className={ctx.className}
      schoolName={ctx.schoolName}
      subjects={ctx.subjects}
      initialConversations={conversations}
      aiConfigured={isTutorAiConfigured()}
      isAuthenticated
    />
  )
}
