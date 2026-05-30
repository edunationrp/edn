import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ReportCardBulletinView } from '@/features/report-cards/report-card-bulletin-view'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

export const metadata: Metadata = { title: 'Bulletin' }

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

  const role = ctx.role_code as UserRole

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cardRaw } = await (supabase as any)
    .from('report_cards')
    .select(`
      id, average, rank, status, serial_number, is_published, correction_note,
      snapshot_json,
      students(first_name, last_name)
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
    is_published: boolean
    correction_note: string | null
    snapshot_json: BulletinSnapshot | null
    students: { first_name: string; last_name: string } | null
  }> | null)?.[0]

  if (!card) notFound()

  const studentName = card.students
    ? `${card.students.last_name} ${card.students.first_name}`
    : 'Élève'

  const canValidate = hasPermission(role, 'report_cards:validate')
  const canPublish = hasPermission(role, 'report_cards:publish')

  if (!card.snapshot_json) {
    return (
      <div className="mx-auto max-w-lg space-y-4 animate-fade-in">
        <PageHeader
          title="Bulletin scolaire"
          description={card.serial_number}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/report-cards">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Link>
            </Button>
          }
        />
        <p className="text-sm text-muted-foreground">
          Bulletin de {studentName} — regénérez les bulletins pour afficher le modèle officiel.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title={`Bulletin — ${studentName}`}
        description={card.serial_number}
        actions={
          <Button variant="outline" size="sm" asChild className="print:hidden">
            <Link href="/dashboard/report-cards">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </Button>
        }
      />

      <ReportCardBulletinView
        reportCardId={card.id}
        snapshot={card.snapshot_json}
        status={card.status}
        isPublished={card.is_published}
        canValidate={canValidate}
        canPublish={canPublish}
        correctionNote={card.correction_note}
      />
    </div>
  )
}
