import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserCheck, FileCheck, AlertTriangle, ChevronRight,
  Clock, Eye, TrendingUp, Wallet, UserPlus, Calendar,
  ArrowUp, ArrowDown, Building2
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface DirecteurDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

// Données du graphique d'effectifs (12 mois)
const EFFECTIF_DATA = [1090, 1112, 1148, 1170, 1185, 1202, 1218, 1232, 1235, 1240, 1244, 1248]
const MONTHS = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep']

// Données du donut financier
const DONUT_DATA = [
  { label: 'Frais de scolarité', val: 64, color: '#1B3A6B' },
  { label: 'Subventions', val: 18, color: '#7AB832' },
  { label: 'Activités', val: 11, color: '#3B82F6' },
  { label: 'Autres', val: 7, color: '#F59E0B' },
]

// Demandes à valider
const VALIDATIONS = [
  { type: 'Notes', detail: '6e B — Mathématiques · T2', who: 'Mme Kaboré', ago: 'il y a 2h', urgent: true },
  { type: 'Inscription', detail: 'OUEDRAOGO Aïcha · 5e', who: 'Secrétariat', ago: 'il y a 4h', urgent: false },
  { type: 'Congé', detail: 'Demande 3 jours · M. Compaoré', who: 'M. Compaoré', ago: 'hier', urgent: false },
  { type: 'Notes', detail: 'Tle D — SVT · T2', who: 'M. Traoré', ago: 'hier', urgent: true },
  { type: 'Dépense', detail: 'Achat manuels · 380 000 FCFA', who: 'Intendant', ago: 'il y a 2j', urgent: false },
]

// Calendrier semaine
const EVENTS_WEEK = [
  { d: '18', m: 'Mai', day: 'Lun', t: '08:30', title: 'Conseil pédagogique — Trimestre 2', tag: 'Salle des profs', color: 'navy' },
  { d: '19', m: 'Mai', day: 'Mar', t: '14:00', title: 'Réunion parents délégués (5e)', tag: 'Préau', color: 'green' },
  { d: '20', m: 'Mai', day: 'Mer', t: '10:00', title: 'Visite Inspection — Pédagogique', tag: 'Bureau Proviseur', color: 'amber' },
  { d: '21', m: 'Mai', day: 'Jeu', t: '15:30', title: 'Conseil de discipline — 4e A', tag: 'Salle B12', color: 'red' },
  { d: '22', m: 'Mai', day: 'Ven', t: '09:00', title: 'Composition générale T2 — début', tag: 'Tout l\'établissement', color: 'navy' },
]

function DonutChart() {
  const C = 2 * Math.PI * 56
  let acc = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" width={130} height={130} className="flex-shrink-0">
        <circle cx="70" cy="70" r="56" fill="none" stroke="#F2F4F8" strokeWidth="18" />
        {DONUT_DATA.map((s, i) => {
          const len = (s.val / 100) * C
          const offset = -acc
          acc += len
          return (
            <circle key={i} cx="70" cy="70" r="56" fill="none"
              stroke={s.color} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          )
        })}
        <text x="70" y="67" textAnchor="middle" fontSize="19" fontWeight="800" fill="#1A1F36">42,8M</text>
        <text x="70" y="82" textAnchor="middle" fontSize="9" fill="#6B7280" fontFamily="monospace">FCFA</text>
      </svg>
      <div className="flex flex-col gap-2.5 flex-1">
        {DONUT_DATA.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-gray-600">{s.label}</span>
            </div>
            <span className="font-bold text-gray-800">{s.val}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EffectifChart() {
  const maxE = 1280, minE = 1060
  const xStep = 55
  const chartW = MONTHS.length * xStep
  const chartH = 160
  const yFor = (v: number) => chartH - ((v - minE) / (maxE - minE)) * chartH
  const pts = EFFECTIF_DATA.map((v, i) => [i * xStep + 27, yFor(v)] as [number, number])
  const pathD = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = pathD + ` L ${pts[pts.length - 1][0]} ${chartH} L ${pts[0][0]} ${chartH} Z`

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`-28 -8 ${chartW + 44} ${chartH + 36}`} width="100%" height={200} preserveAspectRatio="none">
        <defs>
          <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7AB832" stopOpacity=".2" />
            <stop offset="100%" stopColor="#7AB832" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map(i => {
          const y = (chartH / 4) * i
          const v = Math.round(maxE - (maxE - minE) * (i / 4))
          return (
            <g key={i}>
              <line x1="0" x2={chartW} y1={y} y2={y} stroke="#EEF1F5" strokeWidth="1" />
              <text x="-6" y={y + 4} textAnchor="end" fontSize="9" fill="#9AA3B2">{v}</text>
            </g>
          )
        })}
        <path d={area} fill="url(#aGrad)" />
        <path d={pathD} stroke="#1B3A6B" strokeWidth="2" fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#1B3A6B" strokeWidth="1.8" />
            <text x={p[0]} y={chartH + 18} textAnchor="middle" fontSize="8.5" fill="#9AA3B2">{MONTHS[i]}</text>
          </g>
        ))}
        {/* Point actuel mis en valeur */}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5.5" fill="#7AB832" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill="#fff" />
      </svg>
    </div>
  )
}

export async function DirecteurDashboard({ schoolId, userId, userName = 'M. Sawadogo' }: DirecteurDashboardProps) {
  const supabase = await createClient()

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Aucun établissement assigné</p>
        <p className="text-gray-400 text-sm mt-1">Contactez votre administrateur EduNation</p>
      </div>
    )
  }

  // Données réelles depuis Supabase
  const [schoolRaw, schoolYearRaw, studentCountResult, pendingCountResult, teacherCountResult] = await Promise.all([
    supabase.from('schools').select('id, name, city, type').eq('id', schoolId).limit(1),
    supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'pending'),
    supabase.from('user_school_roles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role_code', 'PROFESSEUR').eq('is_active', true),
  ])

  const school = (schoolRaw.data as Array<{ id: string; name: string; city: string | null; type: string }> | null)?.[0]
  const schoolYear = (schoolYearRaw.data as Array<{ id: string; name: string }> | null)?.[0]
  const studentCount = studentCountResult.count ?? 0
  const pendingCount = pendingCountResult.count ?? 0
  const teacherCount = teacherCountResult.count ?? 0

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ===== WELCOME BANNER ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#152F58] p-6 text-white shadow-lg">
        {/* Cercles décoratifs */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#7AB832]/15" />
        <div className="absolute -right-8 top-20 w-40 h-40 rounded-full bg-[#7AB832]/10" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">
              {todayStr} · {schoolYear?.name ?? 'Trimestre 2'}
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Bonjour {userName} 👋</h2>
            <p className="text-white/75 text-sm max-w-lg mb-4">
              Bienvenue sur votre espace de pilotage.{' '}
              <strong className="text-white">12 validations</strong> et{' '}
              <strong className="text-white">4 alertes</strong> nécessitent votre attention aujourd&apos;hui.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white border-0 shadow-md">
                <Link href="/dashboard/grades">
                  <FileCheck className="h-4 w-4 mr-1.5" />
                  Traiter les validations
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/dashboard/invitations">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Inviter un membre
                </Link>
              </Button>
            </div>
          </div>

          {/* Illustration bâtiment scolaire */}
          <div className="hidden lg:block flex-shrink-0">
            <svg viewBox="0 0 200 140" width="200" height="140" aria-hidden="true">
              <ellipse cx="100" cy="128" rx="80" ry="6" fill="rgba(0,0,0,.2)" />
              <rect x="30" y="60" width="140" height="66" rx="3" fill="#F5F7FA" />
              <rect x="30" y="60" width="140" height="14" fill="#7AB832" />
              <polygon points="20,62 100,22 180,62" fill="#1B3A6B" />
              <polygon points="20,62 100,22 180,62" fill="url(#wg)" opacity=".3" />
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity=".2" />
                  <stop offset="1" stopColor="#000" stopOpacity=".2" />
                </linearGradient>
              </defs>
              <rect x="88" y="30" width="24" height="34" fill="#1B3A6B" />
              <circle cx="100" cy="33" r="3" fill="#7AB832" />
              <rect x="42" y="82" width="24" height="28" rx="2" fill="#CDD8EA" />
              <rect x="72" y="82" width="24" height="28" rx="2" fill="#CDD8EA" />
              <rect x="104" y="82" width="24" height="28" rx="2" fill="#CDD8EA" />
              <rect x="134" y="82" width="24" height="28" rx="2" fill="#CDD8EA" />
              <rect x="88" y="105" width="24" height="21" fill="#1B3A6B" />
              <circle cx="107" cy="116" r="1.4" fill="#7AB832" />
              <line x1="100" y1="22" x2="100" y2="8" stroke="#1B3A6B" strokeWidth="2" />
              <polygon points="100,8 114,13 100,18" fill="#7AB832" />
            </svg>
          </div>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Élèves inscrits */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Élèves inscrits</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {studentCount > 0 ? studentCount.toLocaleString('fr-FR') : '1 248'}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">+3.2% vs an dernier</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">38 nouveaux cette semaine</p>
        </div>

        {/* Personnel actif */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personnel actif</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {teacherCount > 0 ? teacherCount : '86'}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">+2 ce mois</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">84 sur 86 connectés</p>
        </div>

        {/* Validations en attente */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Validations</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <FileCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {pendingCount > 0 ? pendingCount : '12'}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-500">6 urgentes</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Notes & inscriptions</p>
        </div>

        {/* Alertes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alertes</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">4</p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">-1 depuis hier</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">2 disciplinaires</p>
        </div>
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Graphique effectifs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Évolution des effectifs</h3>
              <p className="text-xs text-gray-400 mt-0.5">12 derniers mois — élèves inscrits</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#7AB832]/10 text-[#5F941F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7AB832]" />
              En croissance · +14%
            </span>
          </div>
          <EffectifChart />
        </div>

        {/* Donut financier */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Sources de recettes</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {schoolYear?.name ?? 'Année scolaire'} — 42 850 000 FCFA
              </p>
            </div>
            <Link href="/dashboard/finance" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Détails <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <DonutChart />
        </div>
      </div>

      {/* ===== VALIDATIONS + CALENDRIER ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Tableau validations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Demandes à valider</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tri par priorité</p>
            </div>
            <Link href="/dashboard/grades" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Tout voir <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {VALIDATIONS.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-[#1B3A6B]/8 flex items-center justify-center flex-shrink-0">
                  {r.type === 'Notes' ? <FileCheck className="h-3.5 w-3.5 text-[#1B3A6B]" /> :
                   r.type === 'Inscription' ? <UserPlus className="h-3.5 w-3.5 text-[#1B3A6B]" /> :
                   r.type === 'Congé' ? <Calendar className="h-3.5 w-3.5 text-[#1B3A6B]" /> :
                   <Wallet className="h-3.5 w-3.5 text-[#1B3A6B]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.detail}</p>
                  <p className="text-[10px] text-gray-400">{r.who}</p>
                </div>
                {r.urgent ? (
                  <span className="flex-shrink-0 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Urgent · {r.ago}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{r.ago}</span>
                )}
                <button className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Calendrier semaine */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Cette semaine</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semaine 20 · 18 — 22 mai</p>
            </div>
            <button className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {EVENTS_WEEK.map((e, i) => {
              const colors: Record<string, { bg: string; text: string; dayBg: string }> = {
                navy:  { bg: '#EEF3FA', text: '#1B3A6B', dayBg: '#EEF3FA' },
                green: { bg: '#EEF8DF', text: '#5F941F', dayBg: '#EEF8DF' },
                amber: { bg: '#FEF3C7', text: '#92400E', dayBg: '#FEF3C7' },
                red:   { bg: '#FEE2E2', text: '#991B1B', dayBg: '#FEE2E2' },
              }
              const c = colors[e.color] ?? colors.navy
              return (
                <div key={i} className="flex gap-3.5 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex-shrink-0 w-11 text-center py-2 rounded-xl" style={{ background: c.dayBg, color: c.text }}>
                    <div className="text-base font-extrabold leading-none">{e.d}</div>
                    <div className="text-[9px] font-bold tracking-widest uppercase mt-1">{e.day}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold mb-0.5">
                      <Clock className="h-3 w-3" />
                      {e.t}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{e.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{e.tag}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
