import { createClient } from '@/lib/supabase/server'

export type ParentCommunicationItemType = 'announcement' | 'convocation' | 'meeting'

export type ParentAnnouncement = {
  id: string
  title: string
  content: string
  category: 'general' | 'event' | 'info' | 'urgent'
  cover_image_url: string | null
  attachment_url: string | null
  attachment_name: string | null
  target_type: string
  published_at: string
  updated_at: string | null
  authorName: string | null
}

export type ParentMeeting = {
  id: string
  title: string
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  room: string | null
}

export type ParentConvocation = {
  id: string
  title: string
  message: string
  convocation_date: string | null
  location: string | null
  read_at: string | null
  acknowledged_at: string | null
  created_at: string
  senderName: string | null
}

async function getHiddenItemIds(
  parentUserId: string,
  studentId: string,
): Promise<Record<ParentCommunicationItemType, Set<string>>> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('parent_communication_hides')
    .select('item_type, item_id')
    .eq('parent_user_id', parentUserId)
    .eq('student_id', studentId)

  const hidden: Record<ParentCommunicationItemType, Set<string>> = {
    announcement: new Set(),
    convocation: new Set(),
    meeting: new Set(),
  }

  for (const row of (data ?? []) as Array<{ item_type: ParentCommunicationItemType; item_id: string }>) {
    hidden[row.item_type]?.add(row.item_id)
  }

  return hidden
}

export async function getParentAnnouncements(
  schoolId: string,
  classId: string | null,
  parentUserId?: string,
  studentId?: string,
): Promise<ParentAnnouncement[]> {
  const supabase = await createClient()

  const hidden =
    parentUserId && studentId
      ? await getHiddenItemIds(parentUserId, studentId)
      : null

  const { data: rowsRaw } = await supabase
    .from('announcements')
    .select('id, title, content, category, cover_image_url, attachment_url, attachment_name, target_type, target_id, published_at, updated_at, profiles:published_by(full_name)')
    .eq('school_id', schoolId)
    .in('target_type', ['all', 'parents', 'class'])
    .order('published_at', { ascending: false })
    .limit(50)

  const rows = (rowsRaw ?? []) as Array<{
    id: string
    title: string
    content: string
    category: 'general' | 'event' | 'info' | 'urgent' | null
    cover_image_url: string | null
    attachment_url: string | null
    attachment_name: string | null
    target_type: string
    target_id: string | null
    published_at: string
    updated_at: string | null
    profiles: { full_name: string | null } | null
  }>

  return rows
    .filter(row => {
      if (hidden?.announcement.has(row.id)) return false
      if (row.target_type === 'all' || row.target_type === 'parents') return true
      if (row.target_type === 'class' && classId && row.target_id === classId) return true
      return false
    })
    .map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category ?? 'general',
      cover_image_url: row.cover_image_url,
      attachment_url: row.attachment_url,
      attachment_name: row.attachment_name,
      target_type: row.target_type,
      published_at: row.published_at,
      updated_at: row.updated_at,
      authorName: row.profiles?.full_name ?? null,
    }))
}

export async function getParentMeetings(
  schoolId: string,
  classId: string | null,
  parentUserId?: string,
  studentId?: string,
): Promise<ParentMeeting[]> {
  const supabase = await createClient()

  const hidden =
    parentUserId && studentId
      ? await getHiddenItemIds(parentUserId, studentId)
      : null

  const { data: rowsRaw } = await supabase
    .from('calendar_events')
    .select('id, title, description, event_date, start_time, end_time, room, class_id')
    .eq('school_id', schoolId)
    .eq('event_type', 'meeting')
    .order('event_date', { ascending: false })
    .limit(40)

  const rows = (rowsRaw ?? []) as Array<{
    id: string
    title: string
    description: string | null
    event_date: string
    start_time: string | null
    end_time: string | null
    room: string | null
    class_id: string | null
  }>

  return rows
    .filter(row => {
      if (hidden?.meeting.has(row.id)) return false
      return !row.class_id || (classId && row.class_id === classId)
    })
    .map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      event_date: row.event_date,
      start_time: row.start_time,
      end_time: row.end_time,
      room: row.room,
    }))
}

export async function getParentConvocations(
  parentUserId: string,
  studentId: string,
): Promise<ParentConvocation[]> {
  const supabase = await createClient()
  const hidden = await getHiddenItemIds(parentUserId, studentId)

  const { data: rowsRaw } = await supabase
    .from('parent_convocations')
    .select('id, title, message, convocation_date, location, read_at, acknowledged_at, created_at, profiles:sent_by(full_name)')
    .eq('parent_user_id', parentUserId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50)

  return ((rowsRaw ?? []) as Array<{
    id: string
    title: string
    message: string
    convocation_date: string | null
    location: string | null
    read_at: string | null
    acknowledged_at: string | null
    created_at: string
    profiles: { full_name: string | null } | null
  }>)
    .filter(row => !hidden.convocation.has(row.id))
    .map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      convocation_date: row.convocation_date,
      location: row.location,
      read_at: row.read_at,
      acknowledged_at: row.acknowledged_at,
      created_at: row.created_at,
      senderName: row.profiles?.full_name ?? null,
    }))
}

export async function countUnreadParentConvocations(
  parentUserId: string,
  studentId: string,
): Promise<number> {
  const supabase = await createClient()
  const hidden = await getHiddenItemIds(parentUserId, studentId)

  const { data: rows } = await supabase
    .from('parent_convocations')
    .select('id')
    .eq('parent_user_id', parentUserId)
    .eq('student_id', studentId)
    .is('read_at', null)

  return ((rows ?? []) as Array<{ id: string }>).filter(row => !hidden.convocation.has(row.id)).length
}
