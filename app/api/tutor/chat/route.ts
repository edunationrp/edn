import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleTutorChatRequest, type TutorChatRequest } from '@/lib/eleve/tutor-chat-handler'
import { isTutorAiConfigured } from '@/lib/eleve/tutor-openai'
import { resolveTutorContext } from '@/lib/eleve/tutor-resolve-context'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isTutorAiConfigured()) {
    return NextResponse.json(
      {
        error: 'assistant_unconfigured',
        message:
          "L'assistant scolaire n'est pas encore activé. Configurez OPENAI_API_KEY sur le serveur.",
      },
      { status: 503 },
    )
  }

  let body: TutorChatRequest
  try {
    body = (await request.json()) as TutorChatRequest
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ctx = await resolveTutorContext()

  return handleTutorChatRequest(ctx, body, {
    supabase,
    userId: user?.id ?? null,
  })
}
