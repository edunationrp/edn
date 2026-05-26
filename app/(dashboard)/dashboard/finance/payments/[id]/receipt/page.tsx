import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { PrintReceiptButton } from '@/features/finance/print-receipt-button'
import Link from 'next/link'
import { Receipt, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { toMoney } from '@/lib/finance/money'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reçu de paiement' }

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: paymentRaw } = await supabase
    .from('payments')
    .select('id, reference, amount, payment_method, status, created_at, paid_at, notes, metadata, students(first_name, last_name, iun), schools(name)')
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const payment = (paymentRaw as Array<{
    id: string
    reference: string | null
    amount: number
    payment_method: string
    status: string
    created_at: string
    paid_at: string | null
    notes: string | null
    metadata: {
      line_items?: Array<{ name?: string; amount?: number }>
      total_due?: number
    } | null
    students: { first_name: string; last_name: string; iun: string } | null
    schools: { name: string } | null
  }> | null)?.[0]

  if (!payment) notFound()

  const studentName = payment.students
    ? `${payment.students.last_name} ${payment.students.first_name}`
    : 'Élève'

  return (
    <div className="payment-receipt mx-auto max-w-lg space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Reçu de paiement"
        description={payment.reference ?? payment.id.slice(0, 8).toUpperCase()}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/finance/payments">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Link>
            </Button>
            <PrintReceiptButton />
          </div>
        }
      />

      <Card className="border-primary/20">
        <CardHeader className="pb-2 text-center">
          <Receipt className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-base">{payment.schools?.name ?? 'Établissement'}</CardTitle>
          <p className="text-xs text-muted-foreground">Reçu officiel EduNation</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Élève</span>
            <span className="font-medium text-right">{studentName}</span>
          </div>
          {payment.students?.iun && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">IUN</span>
              <span className="font-mono text-xs">{payment.students.iun}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Montant encaissé</span>
            <span className="text-lg font-bold">{formatCurrency(toMoney(payment.amount))}</span>
          </div>
          {payment.metadata?.total_due != null && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total dossier</span>
              <span className="font-medium">{formatCurrency(toMoney(payment.metadata.total_due))}</span>
            </div>
          )}
          {payment.metadata?.line_items && payment.metadata.line_items.length > 0 && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Détail des frais</p>
              <ul className="space-y-1">
                {payment.metadata.line_items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{item.name ?? 'Frais'}</span>
                    <span>{formatCurrency(toMoney(item.amount ?? 0))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {payment.notes && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Notes</span>
              <span className="text-right text-sm">{payment.notes}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Méthode</span>
            <span className="capitalize">{payment.payment_method?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Statut</span>
            <Badge className={getStatusColor(payment.status)}>{getStatusLabel(payment.status)}</Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(payment.paid_at ?? payment.created_at)}</span>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
            Référence : <span className="font-mono font-semibold text-foreground">{payment.reference ?? '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
