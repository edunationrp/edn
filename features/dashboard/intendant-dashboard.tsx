import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Wallet, ArrowUp, ArrowDown, TrendingUp, AlertTriangle,
  ChevronRight, Download, Plus, Eye, Clock, UserPlus
} from 'lucide-react'
import Link from 'next/link'

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
  students?: { first_name: string; last_name: string } | null
}

const RECENT_PAYMENTS = [
  { name: 'COMPAORÉ Awa', classe: '5e A', type: 'Frais de scolarité', amount: 145000, status: 'paid', date: '15/05' },
  { name: 'DICKO Mohamed', classe: '4e B', type: 'Frais de scolarité', amount: 145000, status: 'paid', date: '15/05' },
  { name: 'KABORÉ Inès', classe: '6e B', type: 'Cantine', amount: 28000, status: 'paid', date: '14/05' },
  { name: 'NANA Fatou', classe: 'Tle D', type: 'Frais de scolarité', amount: 165000, status: 'pending', date: '14/05' },
  { name: 'OUEDRAOGO Mariam', classe: '3e A', type: 'Frais de scolarité', amount: 145000, status: 'overdue', date: '12/05' },
]

const MONTHS = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']
const RECETTES = [38, 42, 40, 45, 44, 46, 48, 49]
const DEPENSES = [32, 35, 33, 38, 37, 38, 40, 42]

function BarChart() {
  const maxV = 55
  const bw = 18, gap = 6, gw = bw * 2 + gap
  const totalW = MONTHS.length * (gw + 20)
  const h = 160

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`-28 0 ${totalW + 36} ${h + 36}`} width="100%" height={190}>
        {[0, 1, 2, 3, 4].map(i => {
          const y = 8 + ((h - 8) / 4) * i
          const v = Math.round(maxV - (maxV / 4) * i)
          return (
            <g key={i}>
              <line x1="0" x2={totalW} y1={y} y2={y} stroke="#EEF1F5" strokeWidth="1" />
              <text x="-6" y={y + 4} textAnchor="end" fontSize="9" fill="#9AA3B2">{v}</text>
            </g>
          )
        })}
        {MONTHS.map((m, i) => {
          const x = 10 + i * (gw + 20)
          const recH = ((RECETTES[i] ?? 0) / maxV) * (h - 8)
          const depH = ((DEPENSES[i] ?? 0) / maxV) * (h - 8)
          return (
            <g key={i}>
              <rect x={x} y={h - recH} width={bw} height={recH} rx="3" fill="#1B3A6B" />
              <rect x={x + bw + gap} y={h - depH} width={bw} height={depH} rx="3" fill="#7AB832" />
              <text x={x + bw + gap / 2} y={h + 18} textAnchor="middle" fontSize="9" fill="#9AA3B2">{m}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export async function IntendantDashboard({ schoolId, userId, userName = 'M. Diallo' }: IntendantDashboardProps) {
  const supabase = await createClient()

  let totalCollected = 0
  let totalPending = 0
  let totalOverdue = 0

  if (schoolId) {
    const { data: paymentsRaw } = await supabase
      .from('payments')
      .select('id, amount, status, created_at, students(first_name, last_name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50)

    const payments = (paymentsRaw as Payment[] | null) ?? []

    for (const p of payments) {
      if (p.status === 'paid') totalCollected += p.amount
      else if (p.status === 'pending') totalPending += p.amount
      else if (p.status === 'overdue') totalOverdue += p.amount
    }
  }

  const today = new Date()
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  const fmt = (n: number) => n > 0
    ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
    : '—'

  return (
    <div className="space-y-5 animate-fade-in">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#1a3560] p-6 text-white shadow-lg">
        <div className="absolute -right-16 -top-12 w-56 h-56 rounded-full bg-[#7AB832]/15" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-[#7AB832]/10" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">{todayStr} · Gestion financière</div>
            <h2 className="text-2xl font-extrabold mb-2">Bonjour {userName}</h2>
            <p className="text-white/75 text-sm max-w-lg mb-4">
              <strong className="text-white">48 paiements</strong> en attente de traitement.
              Solde actuel en hausse de <strong className="text-white">+8,2%</strong> vs le mois dernier.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white border-0 shadow-md">
                <Link href="/dashboard/finance/payments/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nouveau paiement
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/dashboard/finance">
                  <Download className="h-4 w-4 mr-1.5" />
                  Exporter rapport
                </Link>
              </Button>
            </div>
          </div>
          {/* Icône décorative */}
          <div className="hidden lg:flex flex-shrink-0 w-28 h-28 rounded-2xl bg-white/10 items-center justify-center">
            <Wallet className="w-14 h-14 text-white/40" />
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Solde actuel</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">14,6 M</p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">+2,1 M ce mois</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Tous comptes confondus</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recettes du mois</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <ArrowUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {totalCollected > 0 ? fmt(totalCollected) : '42,8 M'}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">+8,2% vs avril</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Mai 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiements en attente</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {totalPending > 0 ? fmt(totalPending) : '2,4 M'}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-500">48 familles</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">À régulariser</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Impayés</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {totalOverdue > 0 ? fmt(totalOverdue) : '1,8 M'}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">-12% vs avril</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Retards de paiement</p>
        </div>
      </div>

      {/* CHART + RECENT PAYMENTS */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Bar chart recettes/dépenses */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Recettes vs Dépenses</h3>
              <p className="text-xs text-gray-400 mt-0.5">8 derniers mois — en millions FCFA</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded bg-[#1B3A6B] inline-block" />Recettes</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded bg-[#7AB832] inline-block" />Dépenses</span>
            </div>
          </div>
          <BarChart />
        </div>

        {/* Progression collecte */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Collecte frais de scolarité</h3>
            <p className="text-xs text-gray-400 mt-0.5">Trimestre 2 — Année 2025-2026</p>
          </div>
          <div className="flex-1 flex flex-col gap-5 justify-center">
            {[
              { label: '6e / 5e', alloc: 100, collected: 78, color: '#1B3A6B' },
              { label: '4e / 3e', alloc: 100, collected: 84, color: '#7AB832' },
              { label: '2nd / 1re', alloc: 100, collected: 91, color: '#3B82F6' },
              { label: 'Terminale', alloc: 100, collected: 73, color: '#F59E0B' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{item.label}</span>
                  <span className="font-bold text-gray-900">{item.collected}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.collected}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLEAU DES PAIEMENTS RÉCENTS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Paiements récents</h3>
            <p className="text-xs text-gray-400 mt-0.5">Dernières transactions enregistrées</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
              <Link href="/dashboard/finance">
                <Download className="h-3.5 w-3.5" />
                Exporter
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-[#1B3A6B] hover:bg-[#152F58] text-white text-xs gap-1.5">
              <Link href="/dashboard/finance/payments/new">
                <Plus className="h-3.5 w-3.5" />
                Nouveau paiement
              </Link>
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Classe</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_PAYMENTS.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF3FA] text-[#1B3A6B]">
                      {p.classe}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{p.type}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{p.date}</td>
                  <td className="px-5 py-3.5">
                    {p.status === 'paid' ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#5F941F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7AB832]" />Payé
                      </span>
                    ) : p.status === 'pending' ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En attente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Impayé
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-gray-900">
                    {p.amount.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">5 sur 48 transactions affichées</p>
          <Link href="/dashboard/finance" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
            Voir toutes les transactions <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
