'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import type { AnnouncementCategory } from '@/lib/announcements/constants'
import { notifyParentsOfAnnouncement } from '@/lib/notifications/notify-announcement-parents'

const AnnouncementPayloadSchema = z.object({
  title: z.string().min(3, 'Titre requis (3 caractères minimum)'),
  content: z.string(),
  category: z.enum(['general', 'event', 'info', 'urgent']),
  targetType: z.enum(['all', 'parents', 'class']),
  targetId: z.string().uuid().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
})

export type CreateAnnouncementInput = z.infer<typeof AnnouncementPayloadSchema>

const UpdateAnnouncementSchema = AnnouncementPayloadSchema.extend({
  id: z.string().uuid(),
})

async function requireAnnouncementEditor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'announcements:create')) {
    return { error: 'Vous n\'avez pas les droits pour gérer les annonces.' as const }
  }

  return { supabase, user, schoolId: ctx.school_id }
}

function validateAnnouncementFields(data: z.infer<typeof AnnouncementPayloadSchema>) {
  if (data.targetType === 'class' && !data.targetId) {
    return { error: 'Sélectionnez une classe.' }
  }

  const hasCover = Boolean(data.coverImageUrl)
  const hasAttachment = Boolean(data.attachmentUrl)

  if (!data.content && !hasCover && !hasAttachment) {
    return { error: 'Ajoutez un texte, une image ou un PDF.' }
  }

  return { data }
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const access = await requireAnnouncementEditor()
  if ('error' in access) return access

  const parsed = AnnouncementPayloadSchema.safeParse({
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    coverImageUrl: input.coverImageUrl || null,
    attachmentUrl: input.attachmentUrl || null,
    attachmentName: input.attachmentName?.trim() || null,
    targetId: input.targetId?.trim() || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const validated = validateAnnouncementFields(parsed.data)
  if ('error' in validated) return validated

  const data = validated.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any).from('announcements').insert({
    school_id: access.schoolId,
    title: data.title,
    content: data.content,
    category: data.category as AnnouncementCategory,
    cover_image_url: data.coverImageUrl,
    attachment_url: data.attachmentUrl,
    attachment_name: data.attachmentName,
    target_type: data.targetType,
    target_id: data.targetType === 'class' ? data.targetId! : null,
    published_by: access.user.id,
  })

  if (error) return { error: error.message }

  await notifyParentsOfAnnouncement({
    schoolId: access.schoolId,
    targetType: data.targetType,
    targetId: data.targetId,
    title: data.title,
    body: data.content || 'Une nouvelle annonce est disponible.',
  })

  revalidatePath('/dashboard/communications/announcements')
  revalidatePath('/parent/communications')
  revalidatePath('/parent')
  return { success: true as const }
}

export async function updateAnnouncement(input: z.infer<typeof UpdateAnnouncementSchema>) {
  const access = await requireAnnouncementEditor()
  if ('error' in access) return access

  const parsed = UpdateAnnouncementSchema.safeParse({
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    coverImageUrl: input.coverImageUrl ?? null,
    attachmentUrl: input.attachmentUrl ?? null,
    attachmentName: input.attachmentName?.trim() || null,
    targetId: input.targetId?.trim() || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const validated = validateAnnouncementFields(parsed.data)
  if ('error' in validated) return validated

  const data = validated.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchError } = await (access.supabase as any)
    .from('announcements')
    .select('id, school_id')
    .eq('id', input.id)
    .eq('school_id', access.schoolId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Annonce introuvable.' }

  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('announcements')
    .update({
      title: data.title,
      content: data.content,
      category: data.category as AnnouncementCategory,
      cover_image_url: data.coverImageUrl,
      attachment_url: data.attachmentUrl,
      attachment_name: data.attachmentName,
      target_type: data.targetType,
      target_id: data.targetType === 'class' ? data.targetId! : null,
      updated_at: now,
    })
    .eq('id', input.id)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }

  await notifyParentsOfAnnouncement({
    schoolId: access.schoolId,
    targetType: data.targetType,
    targetId: data.targetId,
    title: data.title,
    body: data.content || 'Une annonce a été mise à jour.',
    isUpdate: true,
  })

  revalidatePath('/dashboard/communications/announcements')
  revalidatePath('/parent/communications')
  revalidatePath('/parent')
  return { success: true as const }
}

export async function deleteAnnouncement(announcementId: string) {
  const access = await requireAnnouncementEditor()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('announcements')
    .delete()
    .eq('id', announcementId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/communications/announcements')
  revalidatePath('/parent/communications')
  revalidatePath('/parent')
  return { success: true as const }
}
