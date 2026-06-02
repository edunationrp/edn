import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, CreditCard, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { ParentStudentFinanceSummary } from '@/lib/finance/parent-student-finance'

function formatPaymentMethod(method: string) {
  const labels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile money',
    bank_transfer: 'Virement',
    other: 'Autre',
  }
  return labels[method] ?? method.replace(/_/g, ' ')
}

type ParentFinanceViewProps = {
  summary: ParentStudentFinanceSummary
  receiptHrefPrefix?: string
  showStudentHeader?: boolean
}

export function ParentFinanceView({
  summary,
  receiptHrefPrefix = '/dashboard/finance/payments',
  showStudentHeader = false,
}: ParentFinanceViewProps) {
  const {
    studentName,
    className,
    schoolYearName,
    tuitionLabel,
    totalDue,
    totalPaid,
    remaining,
    isSettled,
    configured,
    payments,
  } = summary

  const statusMessage = !configured
    ? 'Les tarifs de scolarité sont en cours de configuration par l\'établissement.'
    : totalDue <= 0 && payments.length === 0
      ? 'Aucun frais n\'a encore été enregistré pour cette année scolaire.'
      : isSettled
        ? 'Tous les frais de scolarité sont réglés pour cette année.'
        : remaining > 0
          ? `Il reste ${formatCurrency(remaining)} à régler à l'établissement.`
          : 'Consultez l\'historique ci-dessous.'

  return (
    <div className="space-y-4">
      {showStudentHeader && (
        <div>
          <p className="font-semibold text-gray-900">{studentName}</p>
          <p className="text-sm text-muted-foreground">
            {[className, schoolYearName].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      <Card
        className={
          isSettled
            ? 'border-emerald-200 bg-emerald-50/60'
            : remaining > 0
              ? 'border-amber-200 bg-amber-50/50'
              : undefined
        }
      >
        <CardContent className="flex gap-3 py-4">
          {isSettled ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : remaining > 0 ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isSettled ? 'Situation à jour' : remaining > 0 ? 'Paiement en attente' : 'Situation financière'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{statusMessage}</p>
            {configured && tuitionLabel && (
              <p className="mt-1 text-xs text-muted-foreground">Tarif : {tuitionLabel}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total dû</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {configured || totalDue > 0 ? formatCurrency(totalDue) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total payé</p>
            <p className="mt-1 text-xl font-bold text-[#1B3A6B]">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Reste à payer</p>
            <p
              className={`mt-1 text-xl font-bold ${
                remaining > 0 ? 'text-orange-600' : 'text-emerald-600'
              }`}
            >
              {configured || totalDue > 0 || totalPaid > 0
                ? formatCurrency(remaining)
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Aucun paiement enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(payment => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">
                      {payment.reference ?? 'Sans référence'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                      {' · '}
                      {formatPaymentMethod(payment.paymentMethod)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(payment.status)}>
                      {getStatusLabel(payment.status)}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${receiptHrefPrefix}/${payment.id}/receipt`}>Reçu</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
