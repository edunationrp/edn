const MAX_BYTES = 5 * 1024 * 1024
const COMPRESS_THRESHOLD = 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

export function isSchoolLogoFile(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(png|jpe?g|webp)$/.test(name)
}

export function isSvgLogoFile(file: File) {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
}

export async function prepareSchoolLogoFile(
  file: File
): Promise<{ file: File } | { error: string }> {
  if (!isSchoolLogoFile(file) && !isSvgLogoFile(file)) {
    return { error: 'Format non supporté. Utilisez PNG, JPG ou WebP.' }
  }

  if (file.size > MAX_BYTES) {
    return { error: 'Image trop volumineuse (max 5 Mo).' }
  }

  if (isSvgLogoFile(file)) {
    return { file }
  }

  if (file.size <= COMPRESS_THRESHOLD) {
    return { file }
  }

  try {
    const compressed = await compressRasterLogo(file)
    if (compressed.size > MAX_BYTES) {
      return { error: 'Image trop lourde même après compression. Utilisez une image plus petite.' }
    }
    return { file: compressed }
  } catch {
    return { error: 'Impossible de traiter cette image. Essayez un PNG ou JPG plus léger.' }
  }
}

async function compressRasterLogo(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const maxSide = 1200
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.88)
  )
  if (!blob) throw new Error('blob')

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}-optimized.jpg`, { type: 'image/jpeg' })
}
