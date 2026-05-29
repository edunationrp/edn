import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentTutorContext } from '@/lib/eleve/tutor-context'
import { PUBLIC_TUTOR_CONTEXT } from '@/lib/eleve/tutor-types'
import { isTutorAiConfigured } from '@/lib/eleve/tutor-openai'
import { PublicTutorShell } from '@/components/tuteur/public-tutor-shell'
import { TutorChatClient } from '@/features/tuteur/tutor-chat-client'

export const metadata: Metadata = {
  title: 'EduBot — Assistant scolaire gratuit | EduNation',
  description:
    'Assistant IA pour élèves : explications, révisions et astuces. Gratuit, sans connexion, cadre scolaire uniquement.',
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

  return (
    <PublicTutorShell isAuthenticated={false}>
      <TutorChatClient
        mode="guest"
        firstName={PUBLIC_TUTOR_CONTEXT.firstName}
        className={PUBLIC_TUTOR_CONTEXT.className}
        schoolName={PUBLIC_TUTOR_CONTEXT.schoolName}
        subjects={[]}
        initialConversations={[]}
        aiConfigured={isTutorAiConfigured()}
        isAuthenticated={false}
      />
    </PublicTutorShell>
  )
}
