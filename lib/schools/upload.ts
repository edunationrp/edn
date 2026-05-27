import { createClient } from '@/lib/supabase/client'

export const SCHOOL_LOGOS_BUCKET = 'school-logos'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'])

export function getSchoolLogoPublicUrl(path: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from(SCHOOL_LOGOS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function isSchoolLogoFile(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(png|jpe?g|webp|svg)$/.test(name)
}

function extensionForFile(file: File) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.png')) return 'png'
  if (name.endsWith('.webp')) return 'webp'
  if (name.endsWith('.svg')) return 'svg'
  if (name.endsWith('.jpeg')) return 'jpeg'
  if (name.endsWith('.jpg')) return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/svg+xml') return 'svg'
  return 'jpg'
}

export async function uploadSchoolLogoFile(
  schoolId: string,
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  if (!isSchoolLogoFile(file)) {
    return { error: 'Format non supporté. Utilisez PNG, JPG, WebP ou SVG.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Image trop volumineuse (max 5 Mo).' }
  }

  const supabase = createClient()
  const ext = extensionForFile(file)
  const path = `${schoolId}/logo.${ext}`

  const { error } = await supabase.storage.from(SCHOOL_LOGOS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || `image/${ext === 'svg' ? 'svg+xml' : ext}`,
  })

  if (error) return { error: error.message }

  return {
    path,
    url: getSchoolLogoPublicUrl(path),
  }
}
