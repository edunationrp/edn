import { createClient } from '@/lib/supabase/client'
import type { DocumentKey } from '@/lib/admissions/dossier-metadata'

const BUCKET = 'admission-documents'
const MAX_BYTES = 10 * 1024 * 1024

export function getAdmissionDocumentPublicUrl(path: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function isPdfFile(file: File) {
  const name = file.name.toLowerCase()
  return file.type === 'application/pdf' || name.endsWith('.pdf')
}

export function isIdentityPhotoFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    file.type.startsWith('image/')
    || name.endsWith('.jpg')
    || name.endsWith('.jpeg')
    || name.endsWith('.png')
    || name.endsWith('.webp')
  )
}

export async function uploadAdmissionDocumentPdf(
  schoolId: string,
  requestId: string,
  documentKey: DocumentKey,
  file: File
): Promise<
  | {
      path: string
      url: string
      name: string
      mime: string
      size: number
      uploadedAt: string
    }
  | { error: string }
> {
  if (documentKey === 'student_photo') {
    if (!isIdentityPhotoFile(file)) {
      return { error: 'Photo d\'identité : JPG, PNG ou WebP uniquement.' }
    }
  } else if (!isPdfFile(file)) {
    return { error: 'Seuls les fichiers PDF sont acceptés.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Fichier trop volumineux (max 10 Mo).' }
  }

  const supabase = createClient()
  const safeName = file.name.replace(/[^\w.\-() ]+/g, '_').slice(0, 80)
  const ext =
    documentKey === 'student_photo'
      ? safeName.split('.').pop()?.toLowerCase() || 'jpg'
      : 'pdf'
  const path = `${schoolId}/${requestId}/${documentKey}-${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: documentKey === 'student_photo' ? file.type || `image/${ext}` : 'application/pdf',
  })

  if (error) return { error: error.message }

  return {
    path,
    url: getAdmissionDocumentPublicUrl(path),
    name: safeName,
    mime: documentKey === 'student_photo' ? file.type || `image/${ext}` : 'application/pdf',
    size: file.size,
    uploadedAt: new Date().toISOString(),
  }
}
