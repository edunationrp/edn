import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/cards/kpi-card'
import { CreditCard, TrendingUp, AlertTriangle, FileText, Plus, Download, Search } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

type Payment = {
  id: string
  reference: string | null
  amount: number
  payment_method: string
  status: string
  created_at: string
  student_id: string | null
}

type FeeStructure = {
  id: string
  name: string
  amount: number
  is_mandatory: boolean
  due_date: string | null
}

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id

  const [paymentsResult, feesResult, yearsResult] = await Promise.all([
    schoolId
      ? supabase.from('payments').select('id, reference, amount, payment_method, status, created_at, student_id').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(30)
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('fee_structures').select('id, name, amount, is_mandatory, due_date').eq('school_id', schoolId).order('name')
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1)
      : Promise.resolve({ data: null }),
  ])

  const payments = (paymentsResult.data as Payment[] | null) ?? []
  const feeStructures = (feesResult.data as FeeStructure[] | null) ?? []
  const years = (yearsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const currentYear = years[0]

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'partial').reduce((s, p) => s + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  const totalPayments = payments.length

  const paidCount = payments.filter(p => p.status === 'paid').length
  const partialCount = payments.filter(p => p.status === 'partial').length
  const overdueCount = payments.filter(p => p.status === 'overdue').length
  const collectionRate = totalPayments > 0 ? Math.round((paidCount / totalPayments) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Financière</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Paiements, structures tarifaires et reçus
            {currentYear ? ` · ${currentYear.name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/finance/payments/new">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau paiement
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total collecté"
          value={formatCurrency(totalCollected)}
          icon={<CreditCard className="h-5 w-5" />}
          color="green"
          progress={collectionRate}
          changeLabel={`${collectionRate}% du taux de recouvrement`}
        />
        <KPICard
          title="Paiements partiels"
          value={formatCurrency(totalPending)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="orange"
          change={partialCount}
          changeLabel="dossiers"
        />
        <KPICard
          title="Arriérés"
          value={formatCurrency(totalOverdue)}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
          change={overdueCount}
          changeLabel="dossiers en retard"
        />
        <KPICard
          title="Structures tarifaires"
          value={feeStructures.length}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
      </div>

      {/* Onglets de statuts */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{paidCount}</p>
            <p className="text-sm text-green-600">Payé</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">{partialCount}</p>
            <p className="text-sm text-orange-600">Partiel</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
            <p className="text-sm text-red-600">En retard</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Derniers paiements */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Derniers paiements
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/finance/payments">Voir tout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Référence</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Montant</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Méthode</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Statut</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">Reçu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-mono text-xs">{p.reference ?? '—'}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="px-3 py-2.5 capitalize text-muted-foreground text-xs">
                            {p.payment_method?.replace('_', ' ')}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={`text-xs ${getStatusColor(p.status)}`}>
                              {getStatusLabel(p.status)}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs">{formatDate(p.created_at)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/finance/payments/${p.id}/receipt`}>
                                <FileText className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/dashboard/finance/payments/new">Enregistrer le premier paiement</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Structures tarifaires */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  Frais scolaires
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/finance/fees/new">
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {feeStructures.length > 0 ? (
                <div className="space-y-2">
                  {feeStructures.map(fee => (
                    <div key={fee.id} className="p-3 rounded-lg border hover:border-yellow-300 hover:bg-yellow-50/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{fee.name}</p>
                          {fee.due_date && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Échéance : {formatDate(fee.due_date)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm">{formatCurrency(fee.amount)}</p>
                          {fee.is_mandatory && (
                            <Badge className="text-xs bg-red-100 text-red-700 mt-0.5">Obligatoire</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune structure tarifaire</p>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/dashboard/finance/fees/new">Configurer les frais</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lien paiement rapide */}
          <Card className="mt-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-2">
              <CreditCard className="h-8 w-8 text-primary mx-auto" />
              <p className="font-semibold text-sm">Encaisser un paiement</p>
              <p className="text-xs text-muted-foreground">Rechercher un élève et enregistrer son paiement</p>
              <Button size="sm" className="w-full" asChild>
                <Link href="/dashboard/finance/payments/new">
                  <Search className="h-4 w-4 mr-1" />
                  Nouveau paiement
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
