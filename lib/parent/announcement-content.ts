export type AnnouncementPdfLink = {
  url: string
  label: string
}

export type ParsedAnnouncementContent = {
  body: string
  imageUrls: string[]
  pdfLinks: AnnouncementPdfLink[]
}

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i
const PDF_EXT = /\.pdf(\?.*)?$/i

function isImageUrl(url: string) {
  return IMAGE_EXT.test(url) || url.includes('/storage/v1/object/public/')
}

function isPdfUrl(url: string) {
  return PDF_EXT.test(url)
}

export function inferAnnouncementCategory(title: string): {
  label: string
  tone: 'event' | 'info' | 'urgent' | 'general'
} {
  const t = title.toLowerCase()
  if (/urgent|important|attention|alerte/.test(t)) {
    return { label: 'Important', tone: 'urgent' }
  }
  if (/fête|fete|festival|carnaval|journée|journee|sport|culture|tradition|ceremonie|cérémonie|kermesse|gala/.test(t)) {
    return { label: 'Événement', tone: 'event' }
  }
  if (/examen|rentrée|rentree|orientation|pédagog|pedagog|formation|conférence|conference|éducat|educat/.test(t)) {
    return { label: 'Vie scolaire', tone: 'info' }
  }
  return { label: 'Actualité', tone: 'general' }
}

const CATEGORY_DB_LABELS: Record<'general' | 'event' | 'info' | 'urgent', string> = {
  general: 'Actualité',
  event: 'Événement',
  info: 'Vie scolaire',
  urgent: 'Important',
}

export function resolveAnnouncementCategory(
  title: string,
  category?: 'general' | 'event' | 'info' | 'urgent' | null,
): { label: string; tone: 'event' | 'info' | 'urgent' | 'general' } {
  if (category && CATEGORY_DB_LABELS[category]) {
    return { label: CATEGORY_DB_LABELS[category], tone: category }
  }
  return inferAnnouncementCategory(title)
}

export function parseAnnouncementContent(content: string): ParsedAnnouncementContent {
  const imageUrls: string[] = []
  const pdfLinks: AnnouncementPdfLink[] = []
  let body = content

  body = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const trimmed = url.trim()
    if (isImageUrl(trimmed)) imageUrls.push(trimmed)
    else if (isPdfUrl(trimmed)) pdfLinks.push({ url: trimmed, label: alt?.trim() || 'Document PDF' })
    return ''
  })

  body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const trimmed = url.trim()
    if (isPdfUrl(trimmed)) pdfLinks.push({ url: trimmed, label: label.trim() || 'Document PDF' })
    else if (isImageUrl(trimmed)) imageUrls.push(trimmed)
    return ''
  })

  const lines = body.split('\n')
  const keptLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      keptLines.push('')
      continue
    }

    const bareUrl = trimmed.match(/^https?:\/\/\S+$/i)
    if (bareUrl) {
      const url = bareUrl[0]
      if (isImageUrl(url)) {
        imageUrls.push(url)
        continue
      }
      if (isPdfUrl(url)) {
        pdfLinks.push({ url, label: 'Document PDF' })
        continue
      }
    }

    keptLines.push(line)
  }

  body = keptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  return {
    body,
    imageUrls: [...new Set(imageUrls)],
    pdfLinks,
  }
}
