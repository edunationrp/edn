import { createClient } from '@/lib/supabase/client'

export const STUDENT_PHOTOS_BUCKET = 'student-photos'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export function isStudentPhotoFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    ALLOWED_TYPES.includes(file.type)
    || name.endsWith('.jpg')
    || name.endsWith('.jpeg')
    || name.endsWith('.png')
    || name.endsWith('.webp')
  )
}

function extensionFor(file: File) {
  if (file.type.includes('png')) return 'png'
  if (file.type.includes('webp')) return 'webp'
  return 'jpg'
}

export function getStudentPhotoPublicUrl(path: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from(STUDENT_PHOTOS_BUCKET).getPublicUrl(path)
  return data.publicUrl.split('?')[0]
}

export function studentPhotoDisplayUrl(
  photoUrl: string | null,
  cacheKey?: string | number | null,
) {
  if (!photoUrl) return null
  const base = photoUrl.split('?')[0]
  if (cacheKey == null || cacheKey === '') return base
  return `${base}?v=${encodeURIComponent(String(cacheKey))}`
}

export async function uploadStudentPhoto(
  schoolId: string,
  studentId: string,
  file: File,
): Promise<{ publicUrl: string; path: string } | { error: string }> {
  if (!isStudentPhotoFile(file)) {
    return { error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Photo trop volumineuse (max 5 Mo).' }
  }

  const supabase = createClient()
  const ext = extensionFor(file)
  const path = `${schoolId}/${studentId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(STUDENT_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: '60',
    upsert: false,
    contentType: file.type || `image/${ext}`,
  })

  if (error) return { error: error.message }

  return { publicUrl: getStudentPhotoPublicUrl(path), path }
}
