'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canManageExtraFeeTemplates } from '@/lib/finance/access'
import { toMoney } from '@/lib/finance/money'

async function requireProviseurFinance() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }
  if (!canManageExtraFeeTemplates(ctx.role_code)) {
    return { error: 'Accès réservé à la direction.' as const }
  }

  return { supabase, user, schoolId: ctx.school_id }
}

export async function getExtraFeeTemplates(schoolId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('school_extra_fee_templates')
    .select('id, name, suggested_amount, is_active, sort_order')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  return (
    (data as Array<{
      id: string
      name: string
      suggested_amount: number | null
      is_active: boolean
      sort_order: number
    }> | null) ?? []
  )
}

export async function upsertExtraFeeTemplate(input: {
  name: string
  suggestedAmount?: number | null
  templateId?: string
}) {
  const access = await requireProviseurFinance()
  if ('error' in access) return access

  const name = input.name.trim()
  if (!name) return { error: 'Libellé requis.' }

  const suggestedAmount =
    input.suggestedAmount != null ? toMoney(input.suggestedAmount) : null

  if (input.templateId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (access.supabase as any)
      .from('school_extra_fee_templates')
      .update({
        name,
        suggested_amount: suggestedAmount,
      })
      .eq('id', input.templateId)
      .eq('school_id', access.schoolId)
    if (error) return { error: error.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (access.supabase as any)
      .from('school_extra_fee_templates')
      .insert({
        school_id: access.schoolId,
        name,
        suggested_amount: suggestedAmount,
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/finance/tuition')
  return { success: true as const }
}

export async function deactivateExtraFeeTemplate(templateId: string) {
  const access = await requireProviseurFinance()
  if ('error' in access) return access

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (access.supabase as any)
    .from('school_extra_fee_templates')
    .update({ is_active: false })
    .eq('id', templateId)
    .eq('school_id', access.schoolId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance/tuition')
  return { success: true as const }
}

export async function saveStudentExtraFees(
  schoolId: string,
  studentId: string,
  schoolYearId: string,
  extraFees: Array<{ id: string; label: string; amount: number; templateId?: string }>
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const { data: existing } = await supabase
    .from('student_fee_dossiers')
    .select('id, tuition_amount, tuition_rate_id, level_name, series')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .eq('school_year_id', schoolYearId)
    .limit(1)

  const row = (existing as Array<{
    id: string
    tuition_amount: number
    tuition_rate_id: string | null
    level_name: string | null
    series: string | null
  }> | null)?.[0]

  const payload = {
    extra_fees: extraFees.map(f => ({
      id: f.id,
      label: f.label,
      amount: toMoney(f.amount),
      template_id: f.templateId ?? null,
    })),
    updated_at: new Date().toISOString(),
  }

  if (row) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('student_fee_dossiers')
      .update(payload)
      .eq('id', row.id)
    if (error) return { error: error.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('student_fee_dossiers').insert({
      school_id: schoolId,
      student_id: studentId,
      school_year_id: schoolYearId,
      tuition_amount: 0,
      extra_fees: payload.extra_fees,
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/finance/payments/new')
  return { success: true as const }
}
