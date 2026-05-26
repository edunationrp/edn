import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, FileWarning, Send, UserPlus, Users, FolderOpen, Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { QuickLinkGrid } from '@/components/dashboard/quick-link-grid'
import { SectionPanel, SectionRow } from '@/components/dashboard/section-panel'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { getAdmissionStats, getSecretaryQueue } from '@/lib/admissions/queries'
import { WORKFLOW_STATUS_LABELS } from '@/lib/admissions/workflow'

interface SecretaireDashboardProps {
  schoolId?: string
  userName?: string
}

export async function SecretaireDashboard({ schoolId, userName = 'Secrétaire' }: SecretaireDashboardProps) {
  if (!schoolId) {
    return (
      <EmptyPanel
        title="Aucun établissement assigné"
        description="Contactez votre administrateur pour lier votre compte à un établissement."
      />
    )
  }

  const supabase = await createClient()
  const [stats, queue, yearRaw, studentCountResult] = await Promise.all([
    getAdmissionStats(schoolId),
    getSecretaryQueue(schoolId),
    supabase.from('school_years').select('name').eq('school_id', schoolId).eq('is_active', true).limit(1),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
  ])

  const schoolYear = (yearRaw.data as Array<{ name: string }> | null)?.[0]
  const studentCount = studentCountResult.count ?? 0
  const priorityQueue = queue.slice(0, 5)

  const quickLinks = [
    { href: '/dashboard/admissions/to-process', label: 'Dossiers à traiter', icon: ClipboardList, desc: `${stats.toComplete} en cours` },
    { href: '/dashboard/students', label: 'Registre élèves', icon: Users, desc: `${studentCount} actif(s)` },
    { href: '/dashboard/admissions/admitted', label: 'Suivi finance', icon: Wallet, desc: 'Lecture seule' },
  ]

  return (
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`Secrétariat · ${schoolYear?.name ?? 'Année scolaire'}`}
        title={`Bonjour ${userName}`}
        description={
          stats.toComplete > 0 ? (
            <>
              <strong className="text-white">{stats.toComplete} dossier(s)</strong> à compléter aujourd&apos;hui.
            </>
          ) : (
            'Centre administratif — complétez les dossiers et transmettez-les au proviseur.'
          )
        }
        icon={<ClipboardList className="h-14 w-14 text-white/35" />}
        actions={
          <Button asChild size="sm" variant="brand">
            <Link href="/dashboard/admissions/to-process">
              <FolderOpen className="h-4 w-4" />
              Dossiers à traiter
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Nouveaux dossiers" value={stats.newToday} subtitle="Dernières 24 h" icon={<UserPlus className="h-4 w-4" />} tone="navy" />
        <StatCard title="À compléter" value={stats.toComplete} subtitle="Identité & documents" icon={<ClipboardList className="h-4 w-4" />} tone="amber" />
        <StatCard title="Prêts à soumettre" value={stats.readyToSubmit} subtitle="Pour le proviseur" icon={<Send className="h-4 w-4" />} tone="green" />
        <StatCard title="Chez le proviseur" value={stats.awaitingProviseur} subtitle="En attente décision" icon={<FileWarning className="h-4 w-4" />} tone="rose" />
      </div>

      <QuickLinkGrid links={quickLinks} />

      <SectionPanel
        title="Ma file de travail"
        description="Dossiers prioritaires à traiter"
        actionHref="/dashboard/admissions/to-process"
      >
        {priorityQueue.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            Aucun dossier en attente de complétion.
          </div>
        ) : (
          priorityQueue.map(dossier => (
            <SectionRow
              key={dossier.requestId}
              href={`/dashboard/admissions/${dossier.requestId}`}
              title={`${dossier.lastName} ${dossier.firstName}`}
              subtitle={`${WORKFLOW_STATUS_LABELS[dossier.workflowStatus]}${dossier.className ? ` · ${dossier.className}` : ''}`}
              icon={<ClipboardList className="h-4 w-4" />}
              iconClassName={
                dossier.workflowStatus === 'PRET_VALIDATION'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }
            />
          ))
        )}
      </SectionPanel>
    </DashboardPage>
  )
}
