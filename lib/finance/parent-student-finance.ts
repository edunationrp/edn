import { createClient } from '@/lib/supabase/server'
import { getEncashmentContext } from '@/lib/finance/encashment'
import { toMoney } from '@/lib/finance/money'

export type ParentPaymentHistoryRow = {
  id: string
  amount: number
  reference: string | null
  paidAt: string | null
  createdAt: string
  status: string
  paymentMethod: string
}

export type ParentStudentFinanceSummary = {
  studentId: string
  studentName: string
  className: string | null
  schoolYearName: string | null
  tuitionLabel: string
  totalDue: number
  totalPaid: number
  remaining: number
  isSettled: boolean
  configured: boolean
  extraFeesCount: number
  payments: ParentPaymentHistoryRow[]
}

export async function getParentStudentFinanceSummary(
  schoolId: string,
  studentId: string,
): Promise<ParentStudentFinanceSummary | null> {
  const context = await getEncashmentContext(schoolId, studentId)
  if (!context) return null

  const supabase = await createClient()
  const { data: paymentsRaw } = await supabase
    .from('payments')
    .select('id, amount, reference, paid_at, created_at, status, payment_method')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(100)

  const payments = ((paymentsRaw ?? []) as Array<{
    id: string
    amount: number
    reference: string | null
    paid_at: string | null
    created_at: string
    status: string
    payment_method: string
  }>).map(payment => ({
    id: payment.id,
    amount: toMoney(payment.amount),
    reference: payment.reference,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
    status: payment.status,
    paymentMethod: payment.payment_method,
  }))

  const totalDue = toMoney(context.totalDue)
  const totalPaid = toMoney(context.totalPaid)
  const remaining = toMoney(context.remaining)

  return {
    studentId,
    studentName: `${context.student.firstName} ${context.student.lastName}`.trim(),
    className: context.student.className,
    schoolYearName: context.schoolYear?.name ?? null,
    tuitionLabel: context.officialTuition.label,
    totalDue,
    totalPaid,
    remaining,
    isSettled: totalDue > 0 && remaining <= 0,
    configured: context.officialTuition.configured,
    extraFeesCount: context.extraFees.length,
    payments,
  }
}

export async function getParentChildrenFinanceSummaries(
  schoolId: string,
  studentIds: string[],
): Promise<ParentStudentFinanceSummary[]> {
  const summaries = await Promise.all(
    studentIds.map(studentId => getParentStudentFinanceSummary(schoolId, studentId)),
  )
  return summaries.filter((summary): summary is ParentStudentFinanceSummary => summary !== null)
}
