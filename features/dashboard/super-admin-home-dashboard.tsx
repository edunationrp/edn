import Link from 'next/link'
import {
  AlertTriangle,
  Building2,
  Eye,
  FlaskConical,
  LayoutDashboard,
  Mail,
  Settings,
  Shield,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { SectionPanel, SectionRow } from '@/components/dashboard/section-panel'
import { QuickLinkGrid } from '@/components/dashboard/quick-link-grid'
import { getPlatformAccessControlData } from '@/lib/platform/queries'
import { getQaVerificationSession } from '@/lib/platform/qa-verification.server'
import { getQaRoleLabel } from '@/lib/platform/qa-verification'
import { isEmailConfigured } from '@/lib/email/client'
import { formatRelativeDate } from '@/lib/utils'

type SuperAdminHomeDashboardProps = {
  userId: string
  userName?: string
}

export async function SuperAdminHomeDashboard({
  userId,
  userName = 'Admin',
}: SuperAdminHomeDashboardProps) {
  const [accessData, qaSession] = await Promise.all([
    getPlatformAccessControlData(),
    getQaVerificationSession(userId),
  ])

  const pendingAppeals = accessData.pendingAppeals
  const restrictedSchools = accessData.restrictedSchools
  const suspendedUsers = accessData.suspendedUsers
  const actionCount = pendingAppeals.length + restrictedSchools.length + suspendedUsers.length

  const emailConfigured = isEmailConfigured()
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const serviceAlerts = [
    !emailConfigured && 'Emails non configurés',
    !serviceRoleConfigured && 'Clé service role manquante',
  ].filter(Boolean) as string[]

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  return (
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`${todayStr} · Super Admin EduNation`}
        title={`Bonjour ${userName}`}
        description={
          actionCount > 0 ? (
            <>
              <strong className="text-white">{actionCount} point(s) d&apos;attention</strong> nécessitent votre suivi.
            </>
          ) : (
            'Espace de pilotage — priorités, vérifications et accès rapides à la plateforme.'
          )
        }
        icon={<LayoutDashboard className="h-14 w-14 text-white/35" />}
        actions={
          <>
            <Button asChild size="sm" variant="brand">
              <Link href="/dashboard/platform">
                <Shield className="h-4 w-4" />
                Vue plateforme
              </Link>
            </Button>
            <Button asChild size="sm" variant="navyGhost">
              <Link href="/dashboard/platform/inspect">
                <Eye className="h-4 w-4" />
                Mode vérification
              </Link>
            </Button>
          </>
        }
      />

      {qaSession && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-900">
          <p className="font-semibold">Session de vérification active</p>
          <p className="mt-0.5 text-violet-800/90">
            {getQaRoleLabel(qaSession.roleCode)} · {qaSession.schoolName}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Recours en attente"
          value={pendingAppeals.length}
          subtitle="Demandes de réactivation"
          icon={<Mail className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          title="Écoles restreintes"
          value={restrictedSchools.length}
          subtitle="Suspendues ou désactivées"
          icon={<Building2 className="h-4 w-4" />}
          tone="rose"
        />
        <StatCard
          title="Comptes suspendus"
          value={suspendedUsers.length}
          subtitle="Utilisateurs bloqués"
          icon={<UserX className="h-4 w-4" />}
          tone="navy"
        />
        <StatCard
          title="Mode vérification"
          value={qaSession ? 'Actif' : 'Inactif'}
          subtitle={qaSession ? qaSession.schoolName : 'Simulation de rôle'}
          icon={<FlaskConical className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      <QuickLinkGrid
        links={[
          { href: '/dashboard/platform', label: 'Vue plateforme', icon: Shield, desc: 'KPI et croissance' },
          { href: '/dashboard/platform/inspect', label: 'Mode vérification', icon: Eye, desc: 'Tester un rôle' },
          { href: '/dashboard/platform/access-control', label: 'Contrôle d\'accès', icon: AlertTriangle, desc: `${actionCount} point(s) d'attention` },
          { href: '/dashboard/platform/schools', label: 'Établissements', icon: Building2, desc: 'Gestion des écoles' },
          { href: '/dashboard/platform/audit-logs', label: 'Journaux d\'audit', icon: Shield, desc: 'Traçabilité globale' },
          { href: '/dashboard/platform/settings', label: 'Paramètres', icon: Settings, desc: 'Configuration SaaS' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionPanel
          title="Recours à traiter"
          description="Demandes de réactivation en attente"
          actionHref="/dashboard/platform/access-control"
        >
          {pendingAppeals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun recours en attente.</p>
          ) : (
            pendingAppeals.slice(0, 5).map(appeal => (
              <SectionRow
                key={appeal.id}
                href="/dashboard/platform/access-control"
                title={appeal.requesterName ?? appeal.requesterEmail ?? 'Utilisateur'}
                subtitle={[
                  appeal.appealScope === 'SCHOOL' ? appeal.schoolName : 'Compte utilisateur',
                  formatRelativeDate(appeal.createdAt),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                icon={<Mail className="h-4 w-4" />}
                iconClassName="bg-amber-50 text-amber-700"
              />
            ))
          )}
        </SectionPanel>

        <SectionPanel
          title="Établissements restreints"
          actionHref="/dashboard/platform/access-control"
        >
          {restrictedSchools.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun établissement restreint.</p>
          ) : (
            restrictedSchools.slice(0, 5).map(school => (
              <SectionRow
                key={school.id}
                href={`/dashboard/platform/schools/${school.id}`}
                title={school.name}
                subtitle={[
                  school.platformStatus === 'SUSPENDED' ? 'Suspendu' : 'Désactivé',
                  school.city,
                  school.statusReason,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                icon={<Building2 className="h-4 w-4" />}
                iconClassName="bg-rose-50 text-rose-700"
              />
            ))
          )}
        </SectionPanel>
      </div>

      {serviceAlerts.length > 0 && (
        <SectionPanel title="Alertes techniques" actionHref="/dashboard/platform/settings">
          {serviceAlerts.map(alert => (
            <SectionRow
              key={alert}
              href="/dashboard/platform/settings"
              title={alert}
              subtitle="Vérifier la configuration plateforme"
              icon={<AlertTriangle className="h-4 w-4" />}
              iconClassName="bg-amber-50 text-amber-700"
            />
          ))}
        </SectionPanel>
      )}
    </DashboardPage>
  )
}
