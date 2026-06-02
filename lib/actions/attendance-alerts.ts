'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import {
  getAbsenceAlertConfig,
  processAbsenceThresholdAlerts,
} from '@/lib/attendance/absence-alerts'

export async function checkAbsenceThresholdsForStudents(
  schoolId: string,
  studentIds: string[],
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id || ctx.school_id !== schoolId) {
    return { error: 'Établissement invalide.' }
  }

  const result = await processAbsenceThresholdAlerts(schoolId, studentIds)
  revalidatePath('/dashboard/attendance/alerts')
  revalidatePath('/dashboard/attendance')
  return result
}

const SETTINGS_ROLES = new Set([
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'CENSEUR',
  'SURVEILLANT_GENERAL',
])

export async function updateAbsenceAlertSettings(data: {
  threshold: number
  windowDays: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement.' }
  if (!SETTINGS_ROLES.has(ctx.role_code)) {
    return { error: 'Permission insuffisante.' }
  }

  const threshold = Math.min(50, Math.max(1, Math.round(data.threshold)))
  const windowDays = Math.min(180, Math.max(7, Math.round(data.windowDays)))

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Service indisponible.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('schools')
    .update({
      absence_alert_threshold: threshold,
      absence_alert_window_days: windowDays,
    })
    .eq('id', ctx.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/attendance/alerts')
  return { success: true as const, threshold, windowDays }
}

export async function loadAbsenceAlertSettings() {
  const supabase = await createClient()
  const ctx = await getUserSchoolContext(
    (await supabase.auth.getUser()).data.user?.id ?? '',
  )
  if (!ctx?.school_id) return null
  return getAbsenceAlertConfig(supabase, ctx.school_id)
}
