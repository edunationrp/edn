type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export function isTutorAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export async function streamTutorCompletion(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquante')
  }

  const model = process.env.OPENAI_TUTOR_MODEL?.trim() || 'gpt-4o-mini'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.6,
      max_tokens: 1200,
      messages,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 200)}`)
  }

  if (!response.body) throw new Error('Flux de réponse vide')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        // ignorer les lignes SSE mal formées
      }
    }
  }

  return full.trim()
}
