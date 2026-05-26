'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canConfigureOfficialTuition } from '@/lib/finance/access'
import { toMoney } from '@/lib/finance/money'

async function requireProviseurFinance() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }
  if (!canConfigureOfficialTuition(ctx.role_code)) {
    return { error: 'Seul le proviseur peut configurer les tarifs officiels.' as const }
  }

  return { supabase, user, schoolId: ctx.school_id }
}

export async function upsertOfficialTuitionRate(input: {
  schoolYearId: string
  classLevelId: string
  series: string
  amount: number
  rateId?: string
}) {
  const access = await requireProviseurFinance()
  if ('error' in access) return access

  const amount = toMoney(input.amount)
  if (amount < 0) return { error: 'Montant invalide.' }

  const series = input.series.trim().toUpperCase()
  const payload = {
    school_id: access.schoolId,
    school_year_id: input.schoolYearId,
    class_level_id: input.classLevelId,
    series,
    amount,
    is_active: true,
    created_by: access.user.id,
    updated_at: new Date().toISOString(),
  }

  if (input.rateId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (access.supabase as any)
      .from('official_tuition_rates')
      .update({ amount, updated_at: payload.updated_at })
      .eq('id', input.rateId)
      .eq('school_id', access.schoolId)
    if (error) return { error: error.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (access.supabase as any)
      .from('official_tuition_rates')
      .upsert(payload, { onConflict: 'school_id,school_year_id,class_level_id,series' })
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/finance/tuition')
  revalidatePath('/dashboard/finance')
  return { success: true as const }
}
