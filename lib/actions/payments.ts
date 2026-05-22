'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentReceiptEmail } from '@/lib/email/send'

type Db = SupabaseClient<any>

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
}

export async function recordPaymentWithEmail(input: RecordPaymentInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expirée. Reconnectez-vous.' }
  }

  const { data: paymentRaw, error } = await supabase
    .from('payments')
    .insert({
      school_id: input.schoolId,
      student_id: input.studentId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      status: 'paid',
      reference: input.reference,
      recorded_by: input.recordedBy,
      paid_at: new Date().toISOString(),
    } as never)
    .select('id, reference, amount')
    .single()

  const payment = paymentRaw as { id: string; reference: string | null; amount: number } | null

  if (error || !payment) {
    return { error: error?.message ?? 'Impossible d\'enregistrer le paiement.' }
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { email: string | null } | null
  const recipient = profile?.email
  if (recipient && payment.reference) {
    await sendPaymentReceiptEmail(recipient, {
      studentName: input.studentName,
      amount: Number(payment.amount),
      currency: input.currency ?? 'XOF',
      reference: payment.reference,
      schoolName: input.schoolName,
    })
  }

  return {
    success: true,
    payment,
  }
}
