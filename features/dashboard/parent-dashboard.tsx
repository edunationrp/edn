import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  GraduationCap, Award, Wallet,
  ChevronRight, TrendingUp, UserX,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyPanel } from '@/components/dashboard/empty-panel'

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

export async function ParentDashboard({ schoolId, userId, userName = 'M. Ouedraogo' }: ParentDashboardProps) {
  const supabase = await createClient()

  let children: Child[] = []

  if (schoolId) {
    const { data: relationsRaw } = await (supabase as any)
      .from('parent_student_relations')
      .select('student_id')
      .eq('parent_user_id', userId)
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

  const displayChildren = children

  if (displayChildren.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#1a3560] p-4 text-white shadow-lg sm:p-6">
          <h2 className="text-xl font-extrabold sm:text-2xl">Bonjour {userName}</h2>
          <p className="mt-2 text-sm text-white/75">Espace parent EduNation</p>
        </div>
        <EmptyPanel
          title="Aucun enfant rattaché"
          description="Votre compte n'est pas encore lié à un dossier élève. Demandez au secrétariat de votre établissement de vous associer à votre enfant."
          action={
            <Button asChild size="sm" className="bg-[#1a4d2e] hover:bg-[#2d6a4f]">
              <Link href="/dashboard/messages">Contacter l'école</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const primaryChild = displayChildren[0]

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#1a3560] p-4 text-white shadow-lg sm:p-6">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-[#7AB832]/15" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">
              {todayStr} · Espace parent
            </div>
            <h2 className="text-xl font-extrabold mb-2 sm:text-2xl">Bonjour {userName}</h2>
            <p className="text-white/75 text-sm max-w-lg mb-4">
              Suivez la scolarité de{' '}
              <strong className="text-white">
                {primaryChild.first_name} {primaryChild.last_name}
              </strong>{' '}
              en temps réel.
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
                <Link href="/dashboard/grades" className="text-xs font-semibold text-[#1B3A6B] hover:underline">
                  Voir les notes
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Moy. générale</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">—</p>
          <p className="text-[11px] text-gray-400 mt-1.5">Consultez les notes</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Absences</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">—</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ce trimestre</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bulletins</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">—</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Publiés</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiements</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">—</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            <Link href="/dashboard/finance" className="font-semibold text-[#1B3A6B] hover:underline">
              Voir les paiements
            </Link>
          </p>
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
                {primaryChild.first_name} — {primaryChild.student_enrollments?.[0]?.classes?.name ?? 'Classe non assignée'}
              </p>
            </div>
            <Link href="/dashboard/grades" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Toutes les notes <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="px-5 py-8 text-center text-xs text-gray-500">
            Les notes détaillées seront affichées ici dès leur publication.{' '}
            <Link href="/dashboard/grades" className="font-semibold text-[#1B3A6B] hover:underline">
              Voir toutes les notes
            </Link>
          </div>
        </div>

        {/* Informations & alertes */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[#1B3A6B]/20 bg-[#EEF3FA] p-4">
            <p className="font-bold text-[#1B3A6B] text-sm">Accès simplifié</p>
            <p className="text-xs text-[#1B3A6B]/70 mt-0.5">
              Interface avec support audio en plusieurs langues.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3 border-[#1B3A6B]/30 text-[#1B3A6B] text-xs">
              <Link href="/parent-simple">Accès simplifié</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
