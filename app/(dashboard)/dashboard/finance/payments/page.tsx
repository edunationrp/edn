import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { getScopedStudentIds, canAccessFinance } from '@/lib/dashboard/role-scope'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { CreditCard, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paiements' }

type Payment = {
  id: string
  reference: string | null
  amount: number
  payment_method: string
  status: string
  created_at: string
  student_id: string | null
  students?: { first_name: string; last_name: string } | null
}

export default async function PaymentsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const scopedStudentIds = await getScopedStudentIds(user.id, ctx.role_code)
  if (scopedStudentIds !== null && scopedStudentIds.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Mes paiements" description="Aucun élève lié à votre compte." />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Contactez l&apos;établissement pour associer votre compte à un élève.
          </CardContent>
        </Card>
      </div>
    )
  }

  let query = supabase
    .from('payments')
    .select('id, reference, amount, payment_method, status, created_at, student_id, students(first_name, last_name)')
    .eq('school_id', ctx.school_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (scopedStudentIds) {
    query = query.in('student_id', scopedStudentIds)
  }

  const { data: paymentsRaw } = await query
  const payments = (paymentsRaw as Payment[] | null) ?? []
  const isStaff = canAccessFinance(ctx.role_code)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={isStaff ? 'Tous les paiements' : 'Mes paiements'}
        description={`${payments.length} transaction(s) récente(s)`}
        actions={
          isStaff ? (
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/finance/payments/new">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau paiement
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucun paiement enregistré
            </div>
          ) : (
            <>
              <div className="divide-y sm:hidden">
                {payments.map(p => {
                  const name = p.students
                    ? `${p.students.last_name} ${p.students.first_name}`
                    : 'Élève'
                  return (
                    <div key={p.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">{p.reference ?? '—'}</p>
                        </div>
                        <p className="font-semibold text-sm">{formatCurrency(p.amount)}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge className={`text-xs ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
                      </div>
                      <Button variant="link" size="sm" className="mt-1 h-auto p-0" asChild>
                        <Link href={`/dashboard/finance/payments/${p.id}/receipt`}>Voir le reçu</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Élève</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Référence</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Montant</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Statut</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Reçu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const name = p.students
                        ? `${p.students.last_name} ${p.students.first_name}`
                        : 'Élève'
                      return (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-medium">{name}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{p.reference ?? '—'}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="px-3 py-2.5">
                            <Badge className={`text-xs ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(p.created_at)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/finance/payments/${p.id}/receipt`}>Reçu</Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
