import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, AlertTriangle, Plus, Download, Clock } from 'lucide-react'
import Link from 'next/link'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { SectionPanel, SectionRow } from '@/components/dashboard/section-panel'
import { dashboard } from '@/lib/dashboard/ui-classes'
import { getAdmittedAwaitingPayment } from '@/lib/admissions/queries'

interface IntendantDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

type Payment = {
  id: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  created_at: string
  payment_type?: string | null
  students?: { first_name: string; last_name: string } | null
}

function fmtAmount(n: number) {
  if (n <= 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export async function IntendantDashboard({ schoolId, userName = 'M. Diallo' }: IntendantDashboardProps) {
  const supabase = await createClient()

  let totalCollected = 0
  let totalPending = 0
  let totalOverdue = 0
  let pendingCount = 0
  let overdueCount = 0
  let recentPayments: Payment[] = []
  let admittedAwaitingPayment: Awaited<ReturnType<typeof getAdmittedAwaitingPayment>> = []

  if (schoolId) {
    const [paymentsResult, admittedResult] = await Promise.all([
      supabase
        .from('payments')
        .select('id, amount, status, created_at, payment_type, students(first_name, last_name)')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(50),
      getAdmittedAwaitingPayment(schoolId),
    ])

    recentPayments = (paymentsResult.data as Payment[] | null) ?? []
    admittedAwaitingPayment = admittedResult

    for (const p of recentPayments) {
      if (p.status === 'paid') totalCollected += p.amount
      else if (p.status === 'pending') {
        totalPending += p.amount
        pendingCount += 1
      } else if (p.status === 'overdue') {
        totalOverdue += p.amount
        overdueCount += 1
      }
    }
  }

  const today = new Date()
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`
  const tableRows = recentPayments.slice(0, 8)

  return (
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`${todayStr} · Gestion financière`}
        title={`Bonjour ${userName}`}
        description={
          admittedAwaitingPayment.length > 0 ? (
            <>
              <strong className="text-white">{admittedAwaitingPayment.length} élève(s) admis</strong> sans paiement enregistré.
            </>
          ) : pendingCount > 0 ? (
            <>
              <strong className="text-white">{pendingCount} paiement(s)</strong> en attente de traitement.
            </>
          ) : overdueCount > 0 ? (
            <>
              <strong className="text-white">{overdueCount} impayé(s)</strong> à relancer.
            </>
          ) : (
            'Enregistrez les paiements des familles et suivez la trésorerie de votre établissement.'
          )
        }
        icon={<Wallet className="h-14 w-14 text-white/35" />}
        actions={
          <>
            <Button asChild size="sm" variant="brand">
              <Link href="/dashboard/admissions/admitted">
                <Clock className="h-4 w-4" />
                Admis à encaisser ({admittedAwaitingPayment.length})
              </Link>
            </Button>
            <Button asChild size="sm" variant="navyGhost">
              <Link href="/dashboard/finance/payments/new">
                <Plus className="h-4 w-4" />
                Nouveau paiement
              </Link>
            </Button>
            <Button asChild size="sm" variant="navyGhost">
              <Link href="/dashboard/finance/payments">
                <Download className="h-4 w-4" />
                Historique
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Admis sans paiement" value={admittedAwaitingPayment.length} subtitle="Dossiers à ouvrir" icon={<Clock className="h-4 w-4" />} tone="amber" />
        <StatCard title="Recettes encaissées" value={fmtAmount(totalCollected)} subtitle="Paiements validés" icon={<TrendingUp className="h-4 w-4" />} tone="green" />
        <StatCard title="En attente" value={fmtAmount(totalPending)} subtitle={pendingCount > 0 ? `${pendingCount} transaction(s)` : 'Aucun en attente'} icon={<Clock className="h-4 w-4" />} tone="navy" />
        <StatCard title="Impayés" value={fmtAmount(totalOverdue)} subtitle={overdueCount > 0 ? `${overdueCount} retard(s)` : 'Aucun impayé'} icon={<AlertTriangle className="h-4 w-4" />} tone="rose" />
      </div>

      {admittedAwaitingPayment.length > 0 && (
        <SectionPanel
          title="Admis — paiement à ouvrir"
          description="Élèves validés par le proviseur, en attente d'encaissement"
          actionHref="/dashboard/admissions/admitted"
        >
          {admittedAwaitingPayment.slice(0, 5).map(student => (
            <SectionRow
              key={student.studentId}
              href={`/dashboard/finance/payments/new?studentId=${student.studentId}`}
              title={`${student.lastName} ${student.firstName}`}
              subtitle={student.className ? `Classe ${student.className}` : 'Classe non assignée'}
              icon={<Wallet className="h-4 w-4" />}
              iconClassName="bg-amber-50 text-amber-700"
            />
          ))}
        </SectionPanel>
      )}

      {recentPayments.length === 0 ? (
        <EmptyPanel
          title="Aucun paiement enregistré"
          description="Commencez par enregistrer un premier paiement ou configurez vos structures tarifaires."
          action={
            <Button asChild size="sm" variant="brandDark">
              <Link href="/dashboard/finance/payments/new">Enregistrer un paiement</Link>
            </Button>
          }
        />
      ) : (
        <SectionPanel
          title="Paiements récents"
          description="Dernières transactions enregistrées"
          actionHref="/dashboard/finance/payments"
        >
          <div className="divide-y divide-slate-100 sm:hidden">
            {tableRows.map(p => {
              const name = p.students ? `${p.students.first_name} ${p.students.last_name}` : 'Élève inconnu'
              return (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{p.payment_type ?? 'Paiement'} · {fmtDate(p.created_at)}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{p.amount.toLocaleString('fr-FR')} F</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className={dashboard.tableHead}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Élève</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Montant</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(p => {
                  const name = p.students ? `${p.students.first_name} ${p.students.last_name}` : 'Élève inconnu'
                  return (
                    <tr key={p.id} className={dashboard.tableRow}>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{p.payment_type ?? 'Paiement'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#5F941F]">{p.status}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">{p.amount.toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      )}
    </DashboardPage>
  )
}
