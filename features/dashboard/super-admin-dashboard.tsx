import Link from 'next/link'
import {
  Building2, Users, GraduationCap, TrendingUp, Shield, Layers, Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { SectionPanel, SectionRow } from '@/components/dashboard/section-panel'
import { QuickLinkGrid } from '@/components/dashboard/quick-link-grid'
import { getPlatformOverview } from '@/lib/platform/queries'
import { formatRelativeDate } from '@/lib/utils'
import { SCHOOL_TYPES } from '@/lib/onboarding/constants'

type SuperAdminDashboardProps = {
  userName?: string
}

export async function SuperAdminDashboard({ userName = 'Admin' }: SuperAdminDashboardProps) {
  const overview = await getPlatformOverview()

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  const schoolTypeLabel = (type: string) =>
    SCHOOL_TYPES.find(t => t.value === type)?.label ?? type

  return (
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`${todayStr} · Propriétaire plateforme EduNation`}
        title={`Bonjour ${userName}`}
        description="Administration du SaaS EduNation — tous les établissements et organisations, sans rattachement à une école."
        icon={<Shield className="h-14 w-14 text-white/35" />}
        actions={
          <>
            <Button asChild size="sm" variant="brand">
              <Link href="/dashboard/platform/schools">
                <Building2 className="h-4 w-4" />
                Établissements
              </Link>
            </Button>
            <Button asChild size="sm" variant="navyGhost">
              <Link href="/dashboard/platform/audit-logs">
                <Shield className="h-4 w-4" />
                Journaux d&apos;audit
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Établissements"
          value={overview.schoolsTotal}
          subtitle={`${overview.schoolsActive} actifs`}
          icon={<Building2 className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          title="Organisations"
          value={overview.organizationsTotal}
          subtitle={`${overview.organizationsActive} actives`}
          icon={<Layers className="h-4 w-4" />}
          tone="navy"
        />
        <StatCard
          title="Utilisateurs"
          value={overview.usersTotal}
          subtitle={`${overview.usersActive} actifs · +${overview.signupsLast30Days} (30j)`}
          icon={<Users className="h-4 w-4" />}
          tone="green"
        />
        <StatCard
          title="Élèves inscrits"
          value={overview.studentsActive.toLocaleString('fr-FR')}
          subtitle={`${overview.studentsTotal} dossiers au total`}
          icon={<GraduationCap className="h-4 w-4" />}
          tone="sky"
        />
      </div>

      <QuickLinkGrid
        links={[
          { href: '/dashboard/platform/schools', label: 'Établissements', icon: Building2, desc: `${overview.schoolsTotal} école(s)` },
          { href: '/dashboard/platform/organizations', label: 'Organisations', icon: Layers, desc: `${overview.organizationsTotal} groupe(s)` },
          { href: '/dashboard/platform/users', label: 'Utilisateurs', icon: Users, desc: `${overview.usersTotal} comptes` },
          { href: '/dashboard/platform/reports', label: 'Rapports', icon: TrendingUp, desc: 'Croissance plateforme' },
          { href: '/dashboard/platform/audit-logs', label: 'Audit', icon: Shield, desc: 'Traçabilité globale' },
          { href: '/dashboard/platform/settings', label: 'Paramètres', icon: Activity, desc: 'Configuration plateforme' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionPanel title="Derniers établissements" actionHref="/dashboard/platform/schools">
          {overview.recentSchools.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun établissement enregistré.</p>
          ) : (
            overview.recentSchools.map(school => (
              <SectionRow
                key={school.id}
                href={`/dashboard/platform/schools/${school.id}`}
                title={school.name}
                subtitle={`${school.isActive ? 'Actif' : 'Suspendu'} · ${school.city ?? '—'} · ${formatRelativeDate(school.createdAt)}`}
                icon={<Building2 className="h-4 w-4" />}
                iconClassName="bg-violet-50 text-violet-700"
              />
            ))
          )}
        </SectionPanel>

        <SectionPanel title="Activité récente" actionHref="/dashboard/platform/audit-logs">
          {overview.recentAuditLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune action enregistrée.</p>
          ) : (
            overview.recentAuditLogs.map(log => (
              <SectionRow
                key={log.id}
                href="/dashboard/platform/audit-logs"
                title={log.action}
                subtitle={[
                  log.actorName,
                  log.schoolName,
                  formatRelativeDate(log.createdAt),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                icon={<Shield className="h-4 w-4" />}
                iconClassName="bg-slate-100 text-slate-600"
              />
            ))
          )}
        </SectionPanel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionPanel title="Établissements par type">
          <div className="flex flex-wrap gap-2 p-1">
            {Object.entries(overview.schoolsByType).map(([type, count]) => (
              <div
                key={type}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center"
              >
                <p className="text-lg font-bold text-[#1B3A6B]">{count}</p>
                <p className="text-[11px] font-medium text-slate-500">{schoolTypeLabel(type)}</p>
              </div>
            ))}
            {Object.keys(overview.schoolsByType).length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">—</p>
            )}
          </div>
        </SectionPanel>

        <SectionPanel title="Organisations par plan">
          <div className="flex flex-wrap gap-2 p-1">
            {Object.entries(overview.orgsByPlan).map(([plan, count]) => (
              <div
                key={plan}
                className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-center"
              >
                <p className="text-lg font-bold text-violet-800">{count}</p>
                <p className="text-[11px] font-medium capitalize text-violet-600">{plan}</p>
              </div>
            ))}
            {Object.keys(overview.orgsByPlan).length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">—</p>
            )}
          </div>
        </SectionPanel>
      </div>
    </DashboardPage>
  )
}
