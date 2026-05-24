import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { getScopedStudentIds, canAccessFinance } from '@/lib/dashboard/role-scope'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/cards/kpi-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { CreditCard, TrendingUp, AlertTriangle, FileText, Plus, Download, Search } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { PaymentsTable } from '@/features/finance/payments-table'
import { FeeStructuresTable } from '@/features/finance/fee-structures-table'

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
  const isStaff = canAccessFinance(ctx?.role_code ?? '')
  const scopedStudentIds = user && ctx ? await getScopedStudentIds(user.id, ctx.role_code) : null

  let paymentsQuery = schoolId
    ? supabase.from('payments').select('id, reference, amount, payment_method, status, created_at, student_id, students(first_name, last_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(30)
    : null

  if (paymentsQuery && scopedStudentIds) {
    paymentsQuery = paymentsQuery.in('student_id', scopedStudentIds)
  }

  const [paymentsResult, feesResult, yearsResult] = await Promise.all([
    paymentsQuery ?? Promise.resolve({ data: null }),
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

  const paymentRows = payments.map(p => ({
    id: p.id,
    reference: p.reference,
    amount: p.amount,
    payment_method: p.payment_method,
    status: p.status,
    created_at: p.created_at,
    studentName: p.students
      ? `${p.students.last_name} ${p.students.first_name}`
      : 'Élève',
  }))

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Gestion Financière"
        description={`Paiements, structures tarifaires et reçus${currentYear ? ` · ${currentYear.name}` : ''}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
              <Link href="/dashboard/finance/payments">
                <Download className="h-4 w-4 mr-1" />
                Historique
              </Link>
            </Button>
            {isStaff && (
            <Button size="sm" className="flex-1 sm:flex-none" asChild>
              <Link href="/dashboard/finance/payments/new">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau paiement
              </Link>
            </Button>
            )}
          </>
        }
      />

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Derniers paiements</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/finance/payments">Voir tout</Link>
            </Button>
          </div>
          <PaymentsTable payments={paymentRows} embedded />
        </div>

        <div className="space-y-4">
          <FeeStructuresTable fees={feeStructures} />
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
