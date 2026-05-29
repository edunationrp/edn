import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildTutorSystemPrompt,
  isLikelyOffTopic,
  TUTOR_OFF_TOPIC_REPLY,
} from '@/lib/eleve/tutor-system-prompt'
import type { TutorContextBase } from '@/lib/eleve/tutor-types'
import { formatTutorResponse } from '@/lib/eleve/tutor-format-response'
import { streamTutorCompletion } from '@/lib/eleve/tutor-openai'

export type TutorChatRequest = {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  conversationId?: string
}

function offTopicStream(reply: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: reply })}\n\n`),
      )
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'done', full: reply })}\n\n`),
      )
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

export async function handleTutorChatRequest(
  ctx: TutorContextBase,
  body: TutorChatRequest,
  options?: {
    supabase?: SupabaseClient
    userId?: string | null
  },
): Promise<Response> {
  const message = body.message?.trim()
  if (!message || message.length > 4000) {
    return new Response(JSON.stringify({ error: 'Message invalide' }), { status: 400 })
  }

  if (body.conversationId && options?.supabase && options.userId) {
    const { data: conv } = await (options.supabase as any)
      .from('tutor_conversations')
      .select('id')
      .eq('id', body.conversationId)
      .eq('user_id', options.userId)
      .maybeSingle()

    if (!conv) {
      return new Response(JSON.stringify({ error: 'Conversation introuvable' }), { status: 404 })
    }
  }

  if (isLikelyOffTopic(message)) {
    return offTopicStream(formatTutorResponse(TUTOR_OFF_TOPIC_REPLY))
  }

  const history = (body.history ?? []).slice(-12)
  const openAiMessages = [
    { role: 'system' as const, content: buildTutorSystemPrompt(ctx) },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message },
  ]

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const raw = await streamTutorCompletion(openAiMessages, delta => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`),
          )
        })
        fullText = formatTutorResponse(raw)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', full: fullText })}\n\n`),
        )
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erreur lors de la génération de la réponse."
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
