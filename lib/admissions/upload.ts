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
  if (!isPdfFile(file)) {
    return { error: 'Seuls les fichiers PDF sont acceptés.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Fichier trop volumineux (max 10 Mo).' }
  }

  const supabase = createClient()
  const safeName = file.name.replace(/[^\w.\-() ]+/g, '_').slice(0, 80)
  const path = `${schoolId}/${requestId}/${documentKey}-${crypto.randomUUID()}.pdf`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'application/pdf',
  })

  if (error) return { error: error.message }

  return {
    path,
    url: getAdmissionDocumentPublicUrl(path),
    name: safeName,
    mime: 'application/pdf',
    size: file.size,
    uploadedAt: new Date().toISOString(),
  }
}
