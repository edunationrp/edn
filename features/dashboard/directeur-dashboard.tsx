import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Users, UserCheck, FileCheck, Building2, Grid, Award, Wallet, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { QuickLinkGrid } from '@/components/dashboard/quick-link-grid'
import { SectionPanel, SectionRow } from '@/components/dashboard/section-panel'
import { EmptyPanel } from '@/components/dashboard/empty-panel'

interface DirecteurDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

export async function DirecteurDashboard({ schoolId, userName = 'M. Sawadogo' }: DirecteurDashboardProps) {
  const supabase = await createClient()

  if (!schoolId) {
    return (
      <EmptyPanel
        icon={<Building2 className="h-7 w-7" />}
        title="Aucun établissement assigné"
        description="Contactez votre administrateur EduNation pour lier votre compte à un établissement."
      />
    )
  }

  const [schoolYearRaw, studentCountResult, pendingCountResult, teacherCountResult, classCountResult] =
    await Promise.all([
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
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
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
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`${todayStr} · ${schoolYear?.name ?? 'Année scolaire'}`}
        title={`Bonjour ${userName}`}
        description={
          pendingCount > 0 ? (
            <>
              Bienvenue sur votre espace de pilotage.{' '}
              <strong className="text-white">{pendingCount} inscription(s)</strong> attendent votre validation.
            </>
          ) : (
            'Bienvenue sur votre espace de pilotage. Commencez par inscrire vos élèves et configurer vos classes.'
          )
        }
        icon={<Building2 className="h-14 w-14 text-white/35" />}
        actions={
          <>
            <Button asChild size="sm" variant="brand">
              <Link href="/dashboard/students/pending">
                <FileCheck className="h-4 w-4" />
                Inscriptions en attente
              </Link>
            </Button>
            <Button asChild size="sm" variant="navyGhost">
              <Link href="/dashboard/staff">
                <UserPlus className="h-4 w-4" />
                Gérer le personnel
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Élèves inscrits"
          value={studentCount.toLocaleString('fr-FR')}
          subtitle="Élèves actifs"
          icon={<Users className="h-4 w-4" />}
          tone="navy"
        />
        <StatCard
          title="Personnel actif"
          value={teacherCount}
          subtitle="Professeurs actifs"
          icon={<UserCheck className="h-4 w-4" />}
          tone="green"
        />
        <StatCard
          title="Inscriptions"
          value={pendingCount}
          subtitle="En attente de validation"
          icon={<FileCheck className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          title="Classes"
          value={classCount}
          subtitle={<Link href="/dashboard/classes" className="font-semibold text-[#1B3A6B] hover:text-[#7AB832]">Gérer les classes</Link>}
          icon={<Grid className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      {studentCount === 0 ? (
        <EmptyPanel
          title="Commencez par inscrire vos élèves"
          description="Votre établissement est prêt. Ajoutez vos premières classes et inscrivez vos élèves pour voir les statistiques ici."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild size="sm" variant="brandDark">
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
          <QuickLinkGrid links={quickLinks} />

          <SectionPanel
            title="À traiter"
            description="Actions prioritaires"
            actionHref="/dashboard/students/pending"
          >
            {pendingCount > 0 ? (
              <SectionRow
                href="/dashboard/students/pending"
                title={`${pendingCount} inscription(s) à valider`}
                subtitle="Accéder à la file d'attente"
                icon={<UserPlus className="h-4 w-4" />}
              />
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Aucune demande en attente pour le moment.
              </div>
            )}
          </SectionPanel>
        </>
      )}
    </DashboardPage>
  )
}
