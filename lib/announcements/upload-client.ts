import { createClient } from '@/lib/supabase/client'
import { ANNOUNCEMENTS_BUCKET } from '@/lib/announcements/constants'
import {
  extensionForAnnouncementFile,
  isAnnouncementCoverFile,
  isAnnouncementPdfFile,
  safeAnnouncementFileName,
  validateAnnouncementFileSize,
} from '@/lib/announcements/upload-server'

export function getAnnouncementPublicUrl(path: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from(ANNOUNCEMENTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadAnnouncementFile(
  schoolId: string,
  file: File,
  kind: 'cover' | 'attachment',
): Promise<{ publicUrl: string; fileName: string } | { error: string }> {
  const sizeError = validateAnnouncementFileSize(file)
  if (sizeError) return { error: sizeError }

  if (kind === 'cover' && !isAnnouncementCoverFile(file)) {
    return { error: 'Image non supportée. Utilisez JPG, PNG, WebP ou GIF.' }
  }
  if (kind === 'attachment' && !isAnnouncementPdfFile(file)) {
    return { error: 'Le document doit être un fichier PDF.' }
  }

  const supabase = createClient()
  const safeName = safeAnnouncementFileName(file.name)
  const ext = extensionForAnnouncementFile(safeName, file.type)
  const path = `${schoolId}/${kind}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(ANNOUNCEMENTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) return { error: error.message }

  return {
    publicUrl: getAnnouncementPublicUrl(path),
    fileName: safeName,
  }
}
