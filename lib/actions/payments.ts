'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentReceiptEmail } from '@/lib/email/send'
import { getEncashmentContext } from '@/lib/finance/encashment'
import { saveStudentExtraFees } from '@/lib/actions/extra-fees'
import { toMoney, sumMoney } from '@/lib/finance/money'

export type ExtraFeeLineInput = {
  id: string
  label: string
  amount: number
  templateId?: string
}

export type RecordPaymentInput = {
  schoolId: string
  schoolName: string
  studentId: string
  studentName: string
  amount: number
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'other'
  reference: string
  recordedBy: string
  currency?: string
  notes?: string
  schoolYearId?: string
  dossierId?: string | null
  officialTuition: { rateId: string | null; amount: number; label: string }
  extraFees: ExtraFeeLineInput[]
  totalDue: number
}

export async function fetchEncashmentContext(schoolId: string, studentId: string) {
  const context = await getEncashmentContext(schoolId, studentId)
  if (!context) return { error: 'Élève introuvable.' as const }
  return { context }
}

export async function persistExtraFeesBeforePayment(input: {
  schoolId: string
  studentId: string
  schoolYearId: string
  dossierId: string | null
  extraFees: ExtraFeeLineInput[]
}) {
  if (!input.dossierId) return { success: true as const }
  return saveStudentExtraFees(
    input.schoolId,
    input.studentId,
    input.schoolYearId,
    input.extraFees
  )
}

export async function recordPaymentWithEmail(input: RecordPaymentInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session expirée. Reconnectez-vous.' }

  if (input.amount <= 0) {
    return { error: 'Le montant encaissé doit être supérieur à zéro.' }
  }

  const collectedAmount = toMoney(input.amount)
  const totalDueSnapshot = toMoney(input.totalDue)

  if (input.schoolYearId && input.dossierId) {
    const saveExtras = await saveStudentExtraFees(
      input.schoolId,
      input.studentId,
      input.schoolYearId,
      input.extraFees.map(e => ({ ...e, amount: toMoney(e.amount) }))
    )
    if ('error' in saveExtras && saveExtras.error) {
      return { error: saveExtras.error }
    }
  }

  const existing = await getEncashmentContext(input.schoolId, input.studentId)
  const totalPaidBefore = toMoney(existing?.totalPaid ?? 0)
  const tuitionAmount = toMoney(input.officialTuition.amount)
  const extraFeesNormalized = input.extraFees.map(e => ({
    ...e,
    amount: toMoney(e.amount),
  }))
  const newTotalPaid = totalPaidBefore + collectedAmount
  const paymentStatus = newTotalPaid >= totalDueSnapshot ? 'paid' : 'partial'
  const remainingBefore = Math.max(0, totalDueSnapshot - totalPaidBefore)

  const lineItems = [
    {
      type: 'tuition' as const,
      name: input.officialTuition.label || 'Frais de scolarité officiels',
      amount: tuitionAmount,
      fee_structure_id: input.officialTuition.rateId,
    },
    ...extraFeesNormalized.map(extra => ({
      type: 'extra' as const,
      name: extra.label,
      amount: extra.amount,
      template_id: extra.templateId ?? null,
    })),
  ]

  const metadata = {
    tuition: { ...input.officialTuition, amount: tuitionAmount },
    extra_fees: extraFeesNormalized,
    line_items: lineItems,
    total_due: totalDueSnapshot,
    total_tuition: tuitionAmount,
    total_extras: sumMoney(extraFeesNormalized.map(e => e.amount)),
    collected_at: new Date().toISOString(),
  }

  const { data: paymentRaw, error } = await supabase
    .from('payments')
    .insert({
      school_id: input.schoolId,
      student_id: input.studentId,
      amount: collectedAmount,
      payment_method: input.paymentMethod,
      status: paymentStatus,
      reference: input.reference,
      recorded_by: input.recordedBy,
      paid_at: new Date().toISOString(),
      notes: input.notes?.trim() || null,
      metadata,
    } as never)
    .select('id, reference, amount, status')
    .single()

  const payment = paymentRaw as {
    id: string
    reference: string | null
    amount: number
    status: string
  } | null

  if (error || !payment) {
    return { error: error?.message ?? 'Impossible d\'enregistrer le paiement.' }
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { email: string | null } | null
  if (profile?.email && payment.reference) {
    await sendPaymentReceiptEmail(profile.email, {
      studentName: input.studentName,
      amount: toMoney(payment.amount),
      currency: input.currency ?? 'XOF',
      reference: payment.reference,
      schoolName: input.schoolName,
    })
  }

  revalidatePath('/dashboard/finance')
  revalidatePath('/dashboard/admissions/admitted')
  revalidatePath('/dashboard/finance/payments')

  return {
    success: true,
    payment,
    remainingAfter: Math.max(0, remainingBefore - collectedAmount),
  }
}
