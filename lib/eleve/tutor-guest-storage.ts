const STORAGE_KEY = 'edunation-edubot-guest'

export type GuestTutorMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type GuestTutorConversation = {
  id: string
  title: string
  updated_at: string
  last_preview: string | null
  messages: GuestTutorMessage[]
}

function readAll(): GuestTutorConversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestTutorConversation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(conversations: GuestTutorConversation[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 20)))
}

export function listGuestConversations(): GuestTutorConversation[] {
  return readAll().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}

export function getGuestConversation(id: string): GuestTutorConversation | null {
  return readAll().find(c => c.id === id) ?? null
}

export function createGuestConversation(): GuestTutorConversation {
  const conv: GuestTutorConversation = {
    id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Nouvelle conversation',
    updated_at: new Date().toISOString(),
    last_preview: null,
    messages: [],
  }
  writeAll([conv, ...readAll()])
  return conv
}

export function saveGuestExchange(
  conversationId: string,
  userContent: string,
  assistantContent: string,
  title?: string,
): void {
  const all = readAll()
  const idx = all.findIndex(c => c.id === conversationId)
  if (idx < 0) return

  const now = new Date().toISOString()
  const userMsg: GuestTutorMessage = {
    id: `m-${Date.now()}-u`,
    role: 'user',
    content: userContent,
    created_at: now,
  }
  const assistantMsg: GuestTutorMessage = {
    id: `m-${Date.now()}-a`,
    role: 'assistant',
    content: assistantContent,
    created_at: now,
  }

  const conv = all[idx]
  conv.messages = [...conv.messages, userMsg, assistantMsg]
  conv.updated_at = now
  conv.last_preview = assistantContent.slice(0, 80)
  if (title && (conv.title === 'Nouvelle conversation' || conv.title.length < 4)) {
    conv.title = title.slice(0, 60)
  }

  all[idx] = conv
  writeAll(all)
}

export function deleteGuestConversation(id: string): void {
  writeAll(readAll().filter(c => c.id !== id))
}
