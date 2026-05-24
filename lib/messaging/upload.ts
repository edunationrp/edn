import { createClient } from '@/lib/supabase/client'

const BUCKET = 'message-attachments'

export function getMessageAttachmentPublicUrl(path: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadMessageAttachment(
  schoolId: string,
  conversationId: string,
  file: File
): Promise<
  | { path: string; publicUrl: string; mime: string; size: number; name: string }
  | { error: string }
> {
  const supabase = createClient()
  const safeName = file.name.replace(/[^\w.\-() ]+/g, '_').slice(0, 120)
  const ext = safeName.includes('.') ? safeName.split('.').pop() : 'bin'
  const path = `${schoolId}/${conversationId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) return { error: error.message }

  return {
    path,
    publicUrl: getMessageAttachmentPublicUrl(path),
    mime: file.type || 'application/octet-stream',
    size: file.size,
    name: safeName,
  }
}

export function inferMessageTypeFromFile(file: File): 'audio' | 'image' | 'file' {
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('image/')) return 'image'
  return 'file'
}
