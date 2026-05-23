import { NextResponse } from 'next/server'
import { getResourceBySlug } from '@/lib/marketing/resources'
import { buildMinimalPdf } from '@/lib/pdf/minimal-pdf'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params
  const resource = getResourceBySlug(slug)

  if (!resource) {
    return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const inline = searchParams.get('inline') === '1'
  const pdf = buildMinimalPdf(resource.title)
  const disposition = inline ? 'inline' : 'attachment'

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${resource.fileName}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
