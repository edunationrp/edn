import type { createClient } from '@/lib/supabase/server'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

export type FamilyBulletinRecord = {
  id: string
  term: string | null
  period: string | null
  average: number | null
  rank: number | null
  class_size: number | null
  generated_at: string | null
  school_years: { name: string } | null
  snapshot_json: BulletinSnapshot | null
}

export async function fetchPublishedFamilyBulletins(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
): Promise<FamilyBulletinRecord[]> {
  const { data: bulletinsRaw } = await supabase
    .from('report_cards')
    .select('id, term, period, average, rank, class_size, status, is_published, generated_at, snapshot_json, school_years(name)')
    .eq('student_id', studentId)
    .order('generated_at', { ascending: false })

  return ((bulletinsRaw ?? []) as Array<FamilyBulletinRecord & {
    status: string | null
    is_published: boolean | null
  }>)
    .filter(bulletin => bulletin.is_published || bulletin.status === 'published')
    .filter(bulletin => bulletin.snapshot_json !== null)
}
