import { createClient } from '@/lib/supabase/server'
import type { AnnouncementCategory } from '@/lib/announcements/constants'

export type StaffAnnouncementRow = {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  cover_image_url: string | null
  attachment_url: string | null
  attachment_name: string | null
  target_type: string
  target_id: string | null
  published_at: string
  authorName: string | null
  className: string | null
}

export async function getStaffAnnouncements(schoolId: string): Promise<StaffAnnouncementRow[]> {
  const supabase = await createClient()

  const { data: rowsRaw } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      content,
      category,
      cover_image_url,
      attachment_url,
      attachment_name,
      target_type,
      target_id,
      published_at,
      profiles:published_by(full_name)
    `)
    .eq('school_id', schoolId)
    .order('published_at', { ascending: false })
    .limit(40)

  const rows = (rowsRaw ?? []) as Array<{
    id: string
    title: string
    content: string
    category: AnnouncementCategory
    cover_image_url: string | null
    attachment_url: string | null
    attachment_name: string | null
    target_type: string
    target_id: string | null
    published_at: string
    profiles: { full_name: string | null } | null
  }>

  const classIds = [...new Set(rows.map(row => row.target_id).filter(Boolean))] as string[]
  const classNameById = new Map<string, string>()

  if (classIds.length > 0) {
    const { data: classRows } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', classIds)

    for (const cls of (classRows ?? []) as Array<{ id: string; name: string }>) {
      classNameById.set(cls.id, cls.name)
    }
  }

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category ?? 'general',
    cover_image_url: row.cover_image_url,
    attachment_url: row.attachment_url,
    attachment_name: row.attachment_name,
    target_type: row.target_type,
    target_id: row.target_id,
    published_at: row.published_at,
    authorName: row.profiles?.full_name ?? null,
    className: row.target_id ? classNameById.get(row.target_id) ?? null : null,
  }))
}

export async function getSchoolClassesForAnnouncements(schoolId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('classes')
    .select('id, name, class_levels(name)')
    .eq('school_id', schoolId)
    .order('name')

  return ((data ?? []) as Array<{
    id: string
    name: string
    class_levels: { name: string } | null
  }>).map(row => ({
    id: row.id,
    label: row.class_levels?.name ? `${row.class_levels.name} — ${row.name}` : row.name,
  }))
}
