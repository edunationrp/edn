'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { isSchoolFullAuthority } from '@/types/permissions'
import {
  extensionForFileFromName,
  isSchoolLogoFile,
  SCHOOL_LOGOS_BUCKET,
} from '@/lib/schools/upload-server'
import { clampWatermarkOpacity } from '@/lib/schools/branding'

async function persistLogoUrl(schoolId: string, logoUrl: string | null, useAdmin = false) {
  if (useAdmin) {
    let admin
    try {
      admin = createAdminClient()
    } catch {
      return { error: 'Configuration serveur incomplète.' }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('schools')
      .update({ logo_url: logoUrl })
      .eq('id', schoolId)
    if (error) return { error: error.message }
  } else {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('schools')
      .update({ logo_url: logoUrl })
      .eq('id', schoolId)
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/finance/payments')
  return { success: true as const, logoUrl }
}

export async function uploadSchoolLogo(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }
  if (!isSchoolFullAuthority(ctx.role_code)) {
    return { error: 'Seul le proviseur peut modifier le logo.' }
  }

  const file = formData.get('logo')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Sélectionnez une image.' }
  }
  if (!isSchoolLogoFile(file)) {
    return { error: 'Format non supporté. Utilisez PNG, JPG, WebP ou SVG.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image trop volumineuse (max 5 Mo).' }
  }

  const schoolId = ctx.school_id
  const ext = extensionForFileFromName(file.name, file.type)
  const path = `${schoolId}/logo.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète pour l\'upload.' }
  }

  const { error: uploadError } = await admin.storage.from(SCHOOL_LOGOS_BUCKET).upload(path, bytes, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || `image/${ext === 'svg' ? 'svg+xml' : ext}`,
  })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = admin.storage.from(SCHOOL_LOGOS_BUCKET).getPublicUrl(path)
  return persistLogoUrl(schoolId, urlData.publicUrl)
}

/** Upload logo juste après inscription (avant confirmation email). */
export async function uploadSchoolLogoBootstrap(data: {
  schoolId: string
  email: string
  formData: FormData
}) {
  const file = data.formData.get('logo')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Sélectionnez une image.' }
  }
  if (!isSchoolLogoFile(file)) {
    return { error: 'Format non supporté.' }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolRaw } = await (admin as any)
    .from('schools')
    .select('founder_id')
    .eq('id', data.schoolId)
    .limit(1)

  const school = (schoolRaw as Array<{ founder_id: string }> | null)?.[0]
  if (!school) return { error: 'Établissement introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await (admin as any)
    .from('profiles')
    .select('email')
    .eq('id', school.founder_id)
    .limit(1)

  const profileEmail = (profileRaw as Array<{ email: string | null }> | null)?.[0]?.email
  if (!profileEmail || profileEmail.toLowerCase() !== data.email.trim().toLowerCase()) {
    return { error: 'Non autorisé.' }
  }

  const ext = extensionForFileFromName(file.name, file.type)
  const path = `${data.schoolId}/logo.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage.from(SCHOOL_LOGOS_BUCKET).upload(path, bytes, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || `image/${ext === 'svg' ? 'svg+xml' : ext}`,
  })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = admin.storage.from(SCHOOL_LOGOS_BUCKET).getPublicUrl(path)
  return persistLogoUrl(data.schoolId, urlData.publicUrl, true)
}

export async function removeSchoolLogo() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }
  if (!isSchoolFullAuthority(ctx.role_code)) {
    return { error: 'Seul le proviseur peut modifier le logo.' }
  }

  return persistLogoUrl(ctx.school_id, null)
}

export async function updateSchoolWatermarkOpacity(opacity: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }
  if (!isSchoolFullAuthority(ctx.role_code)) {
    return { error: 'Seul le proviseur peut modifier le filigrane.' }
  }

  const safeOpacity = clampWatermarkOpacity(opacity)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('schools')
    .update({ logo_watermark_opacity: safeOpacity })
    .eq('id', ctx.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true as const, opacity: safeOpacity }
}
