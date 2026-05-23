import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Wallet, TrendingUp, AlertTriangle,
  ChevronRight, Download, Plus, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyPanel } from '@/components/dashboard/empty-panel'

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
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
  }
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export async function IntendantDashboard({ schoolId, userId, userName = 'M. Diallo' }: IntendantDashboardProps) {
  const supabase = await createClient()

  let totalCollected = 0
  let totalPending = 0
  let totalOverdue = 0
  let pendingCount = 0
  let overdueCount = 0
  let recentPayments: Payment[] = []

  if (schoolId) {
    const { data: paymentsRaw } = await supabase
      .from('payments')
      .select('id, amount, status, created_at, payment_type, students(first_name, last_name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50)

    recentPayments = (paymentsRaw as Payment[] | null) ?? []

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
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  const tableRows = recentPayments.slice(0, 8)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#1a3560] p-4 text-white shadow-lg sm:p-6">
        <div className="absolute -right-16 -top-12 w-56 h-56 rounded-full bg-[#7AB832]/15" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">{todayStr} · Gestion financière</div>
            <h2 className="text-xl font-extrabold mb-2 sm:text-2xl">Bonjour {userName}</h2>
            <p className="text-white/75 text-sm max-w-lg mb-4">
              {pendingCount > 0 ? (
                <>
                  <strong className="text-white">{pendingCount} paiement(s)</strong> en attente de traitement.
                </>
              ) : overdueCount > 0 ? (
                <>
                  <strong className="text-white">{overdueCount} impayé(s)</strong> à relancer.
                </>
              ) : (
                'Enregistrez les paiements des familles et suivez la trésorerie de votre établissement.'
              )}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white border-0 shadow-md">
                <Link href="/dashboard/finance/payments/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nouveau paiement
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/dashboard/finance">
                  <Download className="h-4 w-4 mr-1.5" />
                  Voir la caisse
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white/10 items-center justify-center">
            <Wallet className="w-10 h-10 sm:w-14 sm:h-14 text-white/40" />
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recettes encaissées</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">{fmtAmount(totalCollected)}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">Paiements validés</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">En attente</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">{fmtAmount(totalPending)}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {pendingCount > 0 ? `${pendingCount} transaction(s)` : 'Aucun en attente'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Impayés</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">{fmtAmount(totalOverdue)}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {overdueCount > 0 ? `${overdueCount} retard(s)` : 'Aucun impayé'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transactions</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">{recentPayments.length}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">Enregistrées récemment</p>
        </div>
      </div>

      {recentPayments.length === 0 ? (
        <EmptyPanel
          title="Aucun paiement enregistré"
          description="Commencez par enregistrer un premier paiement ou configurez vos structures tarifaires."
          action={
            <Button asChild size="sm" className="bg-[#1a4d2e] hover:bg-[#2d6a4f]">
              <Link href="/dashboard/finance/payments/new">Enregistrer un paiement</Link>
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 px-4 py-4 border-b border-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Paiements récents</h3>
              <p className="text-xs text-gray-400 mt-0.5">Dernières transactions enregistrées</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 flex-1 sm:flex-none">
                <Link href="/dashboard/finance">
                  <Download className="h-3.5 w-3.5" />
                  Caisse
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-[#1B3A6B] hover:bg-[#152F58] text-white text-xs gap-1.5 flex-1 sm:flex-none">
                <Link href="/dashboard/finance/payments/new">
                  <Plus className="h-3.5 w-3.5" />
                  Nouveau
                </Link>
              </Button>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-50 sm:hidden">
            {tableRows.map(p => {
              const name = p.students
                ? `${p.students.first_name} ${p.students.last_name}`
                : 'Élève inconnu'
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={p.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800 text-sm truncate">{name}</p>
                        <p className="font-mono font-bold text-sm text-gray-900 flex-shrink-0">
                          {p.amount.toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.payment_type ?? 'Paiement'} · {fmtDate(p.created_at)}
                      </p>
                      <p className="mt-1.5">
                        {p.status === 'paid' ? (
                          <span className="text-[11px] font-bold text-[#5F941F]">Payé</span>
                        ) : p.status === 'pending' ? (
                          <span className="text-[11px] font-bold text-amber-600">En attente</span>
                        ) : (
                          <span className="text-[11px] font-bold text-red-600">Impayé</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50/70">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tableRows.map(p => {
                  const name = p.students
                    ? `${p.students.first_name} ${p.students.last_name}`
                    : 'Élève inconnu'
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">{name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{p.payment_type ?? 'Paiement'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3.5">
                        {p.status === 'paid' ? (
                          <span className="text-[11px] font-bold text-[#5F941F]">Payé</span>
                        ) : p.status === 'pending' ? (
                          <span className="text-[11px] font-bold text-amber-600">En attente</span>
                        ) : (
                          <span className="text-[11px] font-bold text-red-600">Impayé</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-gray-900">
                        {p.amount.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-gray-400">
              {tableRows.length} sur {recentPayments.length} transaction(s)
            </p>
            <Link href="/dashboard/finance" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Voir toutes les transactions <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
