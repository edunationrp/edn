import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bulletin' }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  generated: 'Généré',
  validated: 'Validé',
  published: 'Publié',
  archived: 'Archivé',
}

export default async function ReportCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: cardRaw } = await supabase
    .from('report_cards')
    .select(`
      id, average, rank, status, serial_number, qr_hash, generated_at,
      students(first_name, last_name, iun),
      classes(name),
      terms(name)
    `)
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const card = (cardRaw as Array<{
    id: string
    average: number | null
    rank: number | null
    status: string
    serial_number: string
    qr_hash: string | null
    generated_at: string | null
    students: { first_name: string; last_name: string; iun: string } | null
    classes: { name: string } | null
    terms: { name: string } | null
  }> | null)?.[0]

  if (!card) notFound()

  const studentName = card.students
    ? `${card.students.last_name} ${card.students.first_name}`
    : 'Élève'

  return (
    <div className="mx-auto max-w-lg space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Bulletin scolaire"
        description={card.serial_number}
        actions={
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/report-cards">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            {studentName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Classe</span>
            <span className="font-medium">{card.classes?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Période</span>
            <span>{card.terms?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Moyenne</span>
            <span className="font-bold">{card.average != null ? `${card.average.toFixed(2)}/20` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rang</span>
            <span>{card.rank ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Statut</span>
            <Badge variant="secondary">{STATUS_LABELS[card.status] ?? card.status}</Badge>
          </div>
          {card.students?.iun && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IUN</span>
              <span className="font-mono text-xs">{card.students.iun}</span>
            </div>
          )}
          {card.qr_hash && (
            <div className="rounded-lg border bg-muted/30 p-3 text-center text-xs">
              Code d&apos;authenticité : <span className="font-mono">{card.qr_hash.slice(0, 16)}…</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
