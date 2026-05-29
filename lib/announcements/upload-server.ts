import { ANNOUNCEMENTS_BUCKET } from '@/lib/announcements/constants'

export { ANNOUNCEMENTS_BUCKET }

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const PDF_TYPE = 'application/pdf'
const MAX_BYTES = 10 * 1024 * 1024

export function isAnnouncementCoverFile(file: File) {
  if (IMAGE_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(jpe?g|png|webp|gif)$/.test(name)
}

export function isAnnouncementPdfFile(file: File) {
  if (file.type === PDF_TYPE) return true
  return file.name.toLowerCase().endsWith('.pdf')
}

export function safeAnnouncementFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, '_').slice(0, 120)
}

export function extensionForAnnouncementFile(name: string, mime: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.webp')) return 'webp'
  if (lower.endsWith('.gif')) return 'gif'
  if (lower.endsWith('.jpeg')) return 'jpeg'
  if (lower.endsWith('.jpg')) return 'jpg'
  if (mime === PDF_TYPE) return 'pdf'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'jpg'
}

export function validateAnnouncementFileSize(file: File) {
  if (file.size > MAX_BYTES) {
    return 'Fichier trop volumineux (max 10 Mo).'
  }
  return null
}
