import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Users, UserCheck, FileCheck, ChevronRight,
  Wallet, UserPlus, Building2, Grid, Award,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyPanel } from '@/components/dashboard/empty-panel'

interface DirecteurDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

export async function DirecteurDashboard({ schoolId, userId, userName = 'M. Sawadogo' }: DirecteurDashboardProps) {
  const supabase = await createClient()

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center sm:py-20">
        <Building2 className="h-14 w-14 text-gray-300 mb-4 sm:h-16 sm:w-16" />
        <p className="text-gray-500 font-medium">Aucun établissement assigné</p>
        <p className="text-gray-400 text-sm mt-1">Contactez votre administrateur EduNation</p>
      </div>
    )
  }

  const [schoolYearRaw, studentCountResult, pendingCountResult, teacherCountResult, classCountResult] = await Promise.all([
    supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'pending'),
    supabase.from('user_school_roles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role_code', 'PROFESSEUR').eq('is_active', true),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
  ])

  const schoolYear = (schoolYearRaw.data as Array<{ id: string; name: string }> | null)?.[0]
  const studentCount = studentCountResult.count ?? 0
  const pendingCount = pendingCountResult.count ?? 0
  const teacherCount = teacherCountResult.count ?? 0
  const classCount = classCountResult.count ?? 0

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  const quickLinks = [
    { href: '/dashboard/students', label: 'Élèves', icon: Users, desc: `${studentCount} inscrit(s)` },
    { href: '/dashboard/classes', label: 'Classes', icon: Grid, desc: `${classCount} classe(s)` },
    { href: '/dashboard/grades', label: 'Notes', icon: FileCheck, desc: 'Validation & saisie' },
    { href: '/dashboard/finance', label: 'Finance', icon: Wallet, desc: 'Trésorerie' },
    { href: '/dashboard/staff', label: 'Personnel', icon: UserCheck, desc: `${teacherCount} professeur(s)` },
    { href: '/dashboard/report-cards', label: 'Bulletins', icon: Award, desc: 'Publications' },
  ]

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#152F58] p-4 text-white shadow-lg sm:p-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#7AB832]/15" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">
              {todayStr} · {schoolYear?.name ?? 'Année scolaire'}
            </div>
            <h2 className="text-xl font-extrabold mb-2 sm:text-2xl">Bonjour {userName}</h2>
            <p className="text-white/75 text-sm max-w-lg mb-4">
              Bienvenue sur votre espace de pilotage.
              {pendingCount > 0 ? (
                <>
                  {' '}
                  <strong className="text-white">{pendingCount} inscription(s)</strong> en attente de validation.
                </>
              ) : (
                ' Commencez par inscrire vos élèves et configurer vos classes.'
              )}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white border-0 shadow-md">
                <Link href="/dashboard/students/pending">
                  <FileCheck className="h-4 w-4 mr-1.5" />
                  Inscriptions en attente
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/dashboard/staff">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Gérer le personnel
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white/10 items-center justify-center">
            <Building2 className="w-10 h-10 sm:w-14 sm:h-14 text-white/40" />
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Élèves inscrits</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {studentCount.toLocaleString('fr-FR')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1.5">Élèves actifs</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personnel actif</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{teacherCount}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">Professeurs actifs</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscriptions</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{pendingCount}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">En attente de validation</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Classes</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Grid className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{classCount}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            <Link href="/dashboard/classes" className="font-semibold text-[#1B3A6B] hover:underline">
              Gérer les classes
            </Link>
          </p>
        </div>
      </div>

      {studentCount === 0 ? (
        <EmptyPanel
          title="Commencez par inscrire vos élèves"
          description="Votre établissement est prêt. Ajoutez vos premières classes et inscrivez vos élèves pour voir les statistiques ici."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild size="sm" className="bg-[#1a4d2e] hover:bg-[#2d6a4f]">
                <Link href="/dashboard/students/new">Inscrire un élève</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/classes">Configurer les classes</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Accès rapides */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map(link => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1B3A6B]/10 text-[#1B3A6B]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm">{link.label}</p>
                    <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </Link>
              )
            })}
          </div>

          {/* Demandes en attente */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-50 sm:px-5">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">À traiter</h3>
                <p className="text-xs text-gray-400 mt-0.5">Actions prioritaires</p>
              </div>
              <Link href="/dashboard/students/pending" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
                Tout voir <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingCount > 0 ? (
                <Link
                  href="/dashboard/students/pending"
                  className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50/70 transition-colors sm:px-5"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {pendingCount} inscription(s) à valider
                    </p>
                    <p className="text-xs text-gray-400">Accéder à la file d&apos;attente</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </Link>
              ) : (
                <div className="px-4 py-8 text-center text-xs text-gray-500 sm:px-5">
                  Aucune demande en attente pour le moment.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
