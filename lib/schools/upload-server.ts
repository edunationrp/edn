export const SCHOOL_LOGOS_BUCKET = 'school-logos'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'])

export function isSchoolLogoFile(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(png|jpe?g|webp|svg)$/.test(name)
}

export function extensionForFileFromName(name: string, mime: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.webp')) return 'webp'
  if (lower.endsWith('.svg')) return 'svg'
  if (lower.endsWith('.jpeg')) return 'jpeg'
  if (lower.endsWith('.jpg')) return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/svg+xml') return 'svg'
  return 'jpg'
}
