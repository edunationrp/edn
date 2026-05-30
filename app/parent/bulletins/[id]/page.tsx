import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { FamilyBulletinView } from '@/features/report-cards/family-bulletin-view'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bulletin — Espace parent' }

export default async function ParentBulletinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) redirect('/parent/bulletins')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cardRaw } = await (supabase as any)
    .from('report_cards')
    .select('id, student_id, status, snapshot_json, is_published')
    .eq('id', id)
    .eq('student_id', activeChild.studentId)
    .maybeSingle()

  const card = cardRaw as {
    id: string
    student_id: string
    status: string
    is_published: boolean
    snapshot_json: BulletinSnapshot | null
  } | null

  if (!card || (!card.is_published && card.status !== 'published')) notFound()
  if (!card.snapshot_json) notFound()

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Bulletin scolaire</h1>
          <p className="text-sm text-muted-foreground">{activeChild.fullName}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/parent/bulletins">Retour</Link>
        </Button>
      </div>

      <FamilyBulletinView snapshot={card.snapshot_json} />
    </div>
  )
}
