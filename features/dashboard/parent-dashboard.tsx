import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  GraduationCap, FileCheck, Award, Wallet,
  ChevronRight, AlertTriangle, TrendingUp, Bell,
  UserX, CircleCheck, ArrowUp
} from 'lucide-react'
import Link from 'next/link'

interface ParentDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

type Relation = { student_id: string }
type Child = {
  id: string
  first_name: string
  last_name: string
  status: string
  student_enrollments?: Array<{ classes?: { name: string } | null }> | null
}

const SAMPLE_NOTES = [
  { matiere: 'Mathématiques', devoir: 14.5, compo: 15, moy: 14.8, color: '#1B3A6B' },
  { matiere: 'Français', devoir: 13, compo: 12.5, moy: 12.8, color: '#7AB832' },
  { matiere: 'SVT', devoir: 16, compo: 15.5, moy: 15.8, color: '#3B82F6' },
  { matiere: 'Anglais', devoir: 12, compo: 11, moy: 11.5, color: '#F59E0B' },
  { matiere: 'Histoire-Géo', devoir: 14, compo: 13.5, moy: 13.8, color: '#A855F7' },
]

export async function ParentDashboard({ schoolId, userId, userName = 'M. Ouedraogo' }: ParentDashboardProps) {
  const supabase = await createClient()

  let children: Child[] = []

  if (schoolId) {
    const { data: relationsRaw } = await supabase
      .from('parent_student_relations')
      .select('student_id')
      .eq('parent_id', userId)
      .limit(10)

    const relations = (relationsRaw as Relation[] | null) ?? []

    if (relations.length > 0) {
      const studentIds = relations.map(r => r.student_id)
      const { data: childrenRaw } = await supabase
        .from('students')
        .select('id, first_name, last_name, status, student_enrollments(classes(name))')
        .in('id', studentIds)
        .limit(10)

      children = (childrenRaw as Child[] | null) ?? []
    }
  }

  const today = new Date()
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`

  const displayChildren = children.length > 0 ? children : [
    {
      id: '1',
      first_name: 'Aïcha',
      last_name: 'OUEDRAOGO',
      status: 'active',
      student_enrollments: [{ classes: { name: '5e A' } }],
    } as Child,
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#1a3560] p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-[#7AB832]/15" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">
              {todayStr} · Espace parent
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Bonjour {userName}</h2>
            <p className="text-white/75 text-sm max-w-lg mb-4">
              Suivez la scolarité de{' '}
              <strong className="text-white">
                {displayChildren[0].first_name} {displayChildren[0].last_name}
              </strong>{' '}
              en temps réel. Moyenne actuelle :{' '}
              <strong className="text-white">13,4 / 20</strong> au Trimestre 2.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white border-0 shadow-md">
                <Link href="/dashboard/report-cards">
                  <Award className="h-4 w-4 mr-1.5" />
                  Voir le bulletin
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/dashboard/finance">
                  <Wallet className="h-4 w-4 mr-1.5" />
                  Mes paiements
                </Link>
              </Button>
            </div>
          </div>
          {/* Illustration enfant */}
          <div className="hidden lg:flex flex-shrink-0 w-28 h-28 rounded-2xl bg-white/10 items-center justify-center">
            <GraduationCap className="w-14 h-14 text-white/40" />
          </div>
        </div>
      </div>

      {/* ENFANTS */}
      {displayChildren.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayChildren.map((child, i) => {
            const className = child.student_enrollments?.[0]?.classes?.name ?? '—'
            const initials = `${child.first_name[0]}${child.last_name[0]}`.toUpperCase()
            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{child.first_name} {child.last_name}</p>
                    <span className="text-[11px] font-semibold bg-[#EEF3FA] text-[#1B3A6B] px-2 py-0.5 rounded-full">
                      {className}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />13,4/20</span>
                  <span className="flex items-center gap-1 text-[#7AB832]"><CircleCheck className="h-3 w-3" />Présent</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Moy. générale</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">13,4</p>
          <div className="flex items-center gap-1 mt-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-xs font-semibold text-[#7AB832]">+0,6 vs T1</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Trimestre 2 · sur 20</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Absences</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">2</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1.5">1 justifiée</p>
          <p className="text-[11px] text-gray-400">Ce trimestre</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bulletins</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">2</p>
          <p className="text-[11px] text-[#5F941F] font-semibold mt-1.5">Disponibles</p>
          <p className="text-[11px] text-gray-400">T1 et T2 publiés</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiements</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">1</p>
          <p className="text-[11px] text-red-500 font-semibold mt-1.5">En attente</p>
          <p className="text-[11px] text-gray-400">145 000 FCFA</p>
        </div>
      </div>

      {/* NOTES + INFOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Tableau des notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Notes — Trimestre 2</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {displayChildren[0].first_name} — {displayChildren[0].student_enrollments?.[0]?.classes?.name ?? '5e A'}
              </p>
            </div>
            <Link href="/dashboard/grades" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Toutes les notes <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {SAMPLE_NOTES.map((n, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors">
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: n.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{n.matiere}</p>
                  <p className="text-[11px] text-gray-400">Devoir: {n.devoir} · Compo: {n.compo}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-mono font-extrabold text-base" style={{ color: n.moy >= 12 ? '#5F941F' : n.moy >= 10 ? '#92400E' : '#991B1B' }}>
                    {n.moy.toFixed(1).replace('.', ',')}
                  </span>
                  <span className="text-gray-400 text-xs">/20</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations & alertes */}
        <div className="flex flex-col gap-4">
          {/* Alerte paiement */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-800 text-sm">Paiement en attente</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Frais de scolarité T2 — 145 000 FCFA à régler avant le 31 mai 2026.
                </p>
                <Button asChild size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5">
                  <Link href="/dashboard/finance">
                    <Wallet className="h-3.5 w-3.5" />
                    Régulariser
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Bulletin disponible */}
          <div className="bg-[#EEF8DF] border border-[#7AB832]/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7AB832]/20 flex items-center justify-center text-[#5F941F] flex-shrink-0">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#3a5f1b] text-sm">Bulletin T2 disponible</p>
                <p className="text-xs text-[#5F941F] mt-0.5">
                  Le bulletin du Trimestre 2 de {displayChildren[0].first_name} est publié.
                </p>
                <Button asChild size="sm" className="mt-3 bg-[#7AB832] hover:bg-[#5F941F] text-white text-xs gap-1.5">
                  <Link href="/dashboard/report-cards">
                    <Award className="h-3.5 w-3.5" />
                    Télécharger le bulletin
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Accès simplifié */}
          <div className="bg-[#EEF3FA] border border-[#1B3A6B]/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B] flex-shrink-0">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1B3A6B] text-sm">Interface simplifiée</p>
                <p className="text-xs text-[#1B3A6B]/70 mt-0.5">
                  Accédez à l&apos;interface simplifiée avec support audio en plusieurs langues.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3 border-[#1B3A6B]/30 text-[#1B3A6B] text-xs gap-1.5">
                  <Link href="/parent-simple">
                    Accès simplifié
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
