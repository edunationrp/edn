import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Building2, Grid, UserCheck, UserPlus, Users, Wallet, ClipboardList, Send,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { QuickLinkGrid } from '@/components/dashboard/quick-link-grid'
import { SectionPanel, SectionRow } from '@/components/dashboard/section-panel'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { getAdmissionStats, getProviseurQueue } from '@/lib/admissions/queries'
import { isSchoolFullAuthority } from '@/types/permissions'

interface DirecteurDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
  role?: string
}

export async function DirecteurDashboard({
  schoolId,
  userName = 'M. Sawadogo',
  role = 'PROVISEUR',
}: DirecteurDashboardProps) {
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

  const isProviseur = isSchoolFullAuthority(role) || role === 'PROVISEUR' || role === 'DIRECTEUR_ADJOINT'

  const [schoolYearRaw, studentCountResult, teacherCountResult, classCountResult, admissionStats, proviseurQueue] =
    await Promise.all([
      supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
      supabase.from('user_school_roles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role_code', 'PROFESSEUR').eq('is_active', true),
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      getAdmissionStats(schoolId),
      isProviseur ? getProviseurQueue(schoolId) : Promise.resolve([]),
    ])

  const schoolYear = (schoolYearRaw.data as Array<{ id: string; name: string }> | null)?.[0]
  const studentCount = studentCountResult.count ?? 0
  const teacherCount = teacherCountResult.count ?? 0
  const classCount = classCountResult.count ?? 0
  const pendingDecisions = admissionStats.awaitingProviseur

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  const quickLinks = isProviseur
    ? [
        { href: '/dashboard/admissions/to-validate', label: 'À valider', icon: UserCheck, desc: `${pendingDecisions} dossier(s)` },
        { href: '/dashboard/admissions/new-request', label: 'Nouvelle demande', icon: UserPlus, desc: 'Après entretien parent' },
        { href: '/dashboard/students', label: 'Élèves', icon: Users, desc: `${studentCount} inscrit(s)` },
        { href: '/dashboard/classes', label: 'Classes', icon: Grid, desc: `${classCount} classe(s)` },
        { href: '/dashboard/finance', label: 'Synthèse finance', icon: Wallet, desc: 'Lecture seule' },
        { href: '/dashboard/staff', label: 'Personnel', icon: UserCheck, desc: `${teacherCount} professeur(s)` },
      ]
    : [
        { href: '/dashboard/students', label: 'Élèves', icon: Users, desc: `${studentCount} inscrit(s)` },
        { href: '/dashboard/classes', label: 'Classes', icon: Grid, desc: `${classCount} classe(s)` },
        { href: '/dashboard/grades', label: 'Notes', icon: ClipboardList, desc: 'Consultation' },
      ]

  return (
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`${todayStr} · ${schoolYear?.name ?? 'Année scolaire'}`}
        title={`Bonjour ${userName}`}
        description={
          isProviseur && pendingDecisions > 0 ? (
            <>
              <strong className="text-white">{pendingDecisions} dossier(s)</strong> attendent votre décision d&apos;admission.
            </>
          ) : isProviseur ? (
            'Pilotage de l\'établissement — validez les admissions soumises par le secrétariat.'
          ) : (
            'Bienvenue sur votre espace de pilotage.'
          )
        }
        icon={<Building2 className="h-14 w-14 text-white/35" />}
        actions={
          isProviseur ? (
            <>
              <Button asChild size="sm" variant="brand">
                <Link href="/dashboard/admissions/to-validate">
                  <UserCheck className="h-4 w-4" />
                  Dossiers à valider
                </Link>
              </Button>
              <Button asChild size="sm" variant="navyGhost">
                <Link href="/dashboard/admissions/new-request">
                  <UserPlus className="h-4 w-4" />
                  Créer une demande
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Élèves inscrits" value={studentCount.toLocaleString('fr-FR')} subtitle="Actifs" icon={<Users className="h-4 w-4" />} tone="navy" />
        {isProviseur ? (
          <>
            <StatCard title="À valider" value={pendingDecisions} subtitle="Décision proviseur" icon={<Send className="h-4 w-4" />} tone="amber" />
            <StatCard title="Chez secrétariat" value={admissionStats.toComplete} subtitle="En complétion" icon={<ClipboardList className="h-4 w-4" />} tone="green" />
            <StatCard title="Classes" value={classCount} subtitle="Organisation" icon={<Grid className="h-4 w-4" />} tone="rose" />
          </>
        ) : (
          <>
            <StatCard title="Personnel" value={teacherCount} subtitle="Professeurs" icon={<UserCheck className="h-4 w-4" />} tone="green" />
            <StatCard title="Classes" value={classCount} subtitle="Actives" icon={<Grid className="h-4 w-4" />} tone="amber" />
          </>
        )}
      </div>

      <QuickLinkGrid links={quickLinks} />

      {isProviseur && (
        <SectionPanel
          title="Décisions en attente"
          description="Dossiers soumis par le secrétariat"
          actionHref="/dashboard/admissions/to-validate"
        >
          {proviseurQueue.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              Aucun dossier en attente de votre décision.
            </div>
          ) : (
            proviseurQueue.slice(0, 5).map(dossier => (
              <SectionRow
                key={dossier.requestId}
                href="/dashboard/admissions/to-validate"
                title={`${dossier.lastName} ${dossier.firstName}`}
                subtitle={dossier.className ? `Classe ${dossier.className}` : 'Classe à confirmer'}
                icon={<UserCheck className="h-4 w-4" />}
                iconClassName="bg-amber-50 text-amber-700"
              />
            ))
          )}
        </SectionPanel>
      )}
    </DashboardPage>
  )
}
