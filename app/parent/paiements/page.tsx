import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import { CreditCard } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paiements — Espace parent' }

export default async function ParentPaiementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Paiements" />
  }

  const { data: paymentsRaw } = await supabase
    .from('payments')
    .select('id, reference, amount, payment_method, status, created_at')
    .eq('student_id', activeChild.studentId)
    .eq('school_id', activeChild.schoolId)
    .order('created_at', { ascending: false })
    .limit(100)

  const payments = (paymentsRaw ?? []) as Array<{
    id: string
    reference: string | null
    amount: number
    payment_method: string
    status: string
    created_at: string
  }>

  const pendingTotal = payments
    .filter(payment => ['pending', 'partial', 'overdue'].includes(payment.status))
    .reduce((sum, payment) => sum + payment.amount, 0)

  const paidTotal = payments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Paiements</h1>
        <p className="text-sm text-muted-foreground">
          {activeChild.fullName} · {activeChild.schoolName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Reste à payer</p>
            <p className="mt-1 text-xl font-bold text-orange-600">{formatCurrency(pendingTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total payé</p>
            <p className="mt-1 text-xl font-bold text-[#1B3A6B]">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré pour cet enfant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map(payment => (
            <Card key={payment.id}>
              <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{payment.reference ?? 'Sans référence'}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                </div>
                <Badge className={getStatusColor(payment.status)}>
                  {getStatusLabel(payment.status)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
