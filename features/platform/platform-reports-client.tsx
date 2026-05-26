'use client'

import { Building2, Layers, Users, GraduationCap, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SCHOOL_TYPES } from '@/lib/onboarding/constants'
import type { PlatformOverview } from '@/lib/platform/types'

type PlatformReportsClientProps = {
  overview: PlatformOverview
}

export function PlatformReportsClient({ overview }: PlatformReportsClientProps) {
  const schoolTypeLabel = (type: string) =>
    SCHOOL_TYPES.find(t => t.value === type)?.label ?? type

  const activationRate =
    overview.schoolsTotal > 0
      ? Math.round((overview.schoolsActive / overview.schoolsTotal) * 100)
      : 0

  const userActivationRate =
    overview.usersTotal > 0
      ? Math.round((overview.usersActive / overview.usersTotal) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Croissance (30j)"
          value={`+${overview.signupsLast30Days}`}
          subtitle="Nouveaux comptes"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="green"
        />
        <StatCard
          title="Taux activation écoles"
          value={`${activationRate}%`}
          subtitle={`${overview.schoolsActive} / ${overview.schoolsTotal}`}
          icon={<Building2 className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          title="Taux activation comptes"
          value={`${userActivationRate}%`}
          subtitle={`${overview.usersActive} / ${overview.usersTotal}`}
          icon={<Users className="h-4 w-4" />}
          tone="navy"
        />
        <StatCard
          title="Élèves actifs"
          value={overview.studentsActive.toLocaleString('fr-FR')}
          subtitle="Tous établissements"
          icon={<GraduationCap className="h-4 w-4" />}
          tone="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par type d&apos;établissement</CardTitle>
            <CardDescription>Distribution des écoles inscrites sur EduNation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(overview.schoolsByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const pct = overview.schoolsTotal
                    ? Math.round((count / overview.schoolsTotal) * 100)
                    : 0
                  return (
                    <div key={type}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{schoolTypeLabel(type)}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#1B3A6B] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              {Object.keys(overview.schoolsByType).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-600" />
              Plans d&apos;abonnement
            </CardTitle>
            <CardDescription>Organisations par formule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(overview.orgsByPlan)
                .sort((a, b) => b[1] - a[1])
                .map(([plan, count]) => {
                  const pct = overview.organizationsTotal
                    ? Math.round((count / overview.organizationsTotal) * 100)
                    : 0
                  return (
                    <div key={plan}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium capitalize">{plan}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-violet-50">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              {Object.keys(overview.orgsByPlan).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune organisation.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Synthèse plateforme</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Établissements', value: overview.schoolsTotal },
              { label: 'Organisations', value: overview.organizationsTotal },
              { label: 'Utilisateurs', value: overview.usersTotal },
              { label: 'Élèves (dossiers)', value: overview.studentsTotal },
            ].map(item => (
              <div key={item.label} className="rounded-xl border bg-slate-50/50 px-4 py-3">
                <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-2xl font-bold text-[#1B3A6B]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
