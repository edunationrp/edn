import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FamilyBulletinView } from '@/features/report-cards/family-bulletin-view'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon bulletin — EduNation' }

export default async function EleveBulletinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as { id: string } | null
  if (!student) redirect('/login/eleve')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cardRaw } = await (supabase as any)
    .from('report_cards')
    .select('id, student_id, status, snapshot_json, is_published')
    .eq('id', id)
    .eq('student_id', student.id)
    .maybeSingle()

  const card = cardRaw as {
    id: string
    status: string
    is_published: boolean
    snapshot_json: BulletinSnapshot | null
  } | null

  if (!card || (!card.is_published && card.status !== 'published')) notFound()
  if (!card.snapshot_json) notFound()

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mon bulletin</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/eleve/bulletins">Retour</Link>
        </Button>
      </div>

      <FamilyBulletinView snapshot={card.snapshot_json} />
    </div>
  )
}
