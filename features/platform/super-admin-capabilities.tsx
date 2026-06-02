import type { LucideIcon } from 'lucide-react'
import {
  ShieldCheck,
  Building2,
  Layers,
  Users,
  Shield,
  LifeBuoy,
} from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type CapabilityStatus = 'available' | 'partial' | 'planned'

const STATUS_META: Record<CapabilityStatus, { label: string; variant: BadgeProps['variant'] }> = {
  available: { label: 'Disponible', variant: 'success' },
  partial: { label: 'Partiel', variant: 'info' },
  planned: { label: 'A venir', variant: 'warning' },
}

type CapabilityItem = {
  label: string
  status: CapabilityStatus
  hint?: string
}

type CapabilityGroup = {
  title: string
  description: string
  icon: LucideIcon
  items: CapabilityItem[]
}

const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    title: 'Pilotage plateforme',
    description: 'Suivi global et performance du SaaS.',
    icon: ShieldCheck,
    items: [
      { label: 'Tableau de bord global & KPI', status: 'available' },
      { label: 'Rapports de croissance et activation', status: 'available' },
      { label: "Journaux d'audit multi-établissements", status: 'available' },
      { label: 'Etat des services critiques', status: 'available' },
    ],
  },
  {
    title: 'Etablissements',
    description: 'Controle des ecoles et direction.',
    icon: Building2,
    items: [
      { label: 'Consulter et suspendre un etablissement', status: 'available' },
      { label: 'Passation de direction (proviseur)', status: 'available' },
      { label: 'Statistiques eleves et personnel', status: 'available' },
      { label: 'Creation et rattachement initial', status: 'partial', hint: 'via onboarding fondateur' },
    ],
  },
  {
    title: 'Organisations & plans',
    description: 'Gestion des groupes multi-etablissements.',
    icon: Layers,
    items: [
      { label: 'Activer / suspendre une organisation', status: 'available' },
      { label: 'Modifier plan et quota etablissements', status: 'available' },
      { label: 'Configurer nouveaux plans', status: 'planned' },
    ],
  },
  {
    title: 'Utilisateurs & acces',
    description: 'Comptes, roles et securite.',
    icon: Users,
    items: [
      { label: 'Activer / suspendre un compte', status: 'available' },
      { label: 'Visibilite des roles et rattachements', status: 'available' },
      { label: 'Reinitialiser mot de passe / sessions', status: 'planned' },
    ],
  },
  {
    title: 'Securite & conformite',
    description: 'Protection et gouvernance des donnees.',
    icon: Shield,
    items: [
      { label: "Audit des actions sensibles", status: 'available' },
      { label: 'Politiques 2FA / restrictions IP', status: 'planned' },
      { label: 'Sauvegarde et restauration', status: 'planned' },
    ],
  },
  {
    title: 'Support & donnees',
    description: 'Assistance et qualite des donnees.',
    icon: LifeBuoy,
    items: [
      { label: 'Exports globaux et rapports complets', status: 'planned' },
      { label: 'Impersonation support securisee', status: 'planned' },
      { label: 'Outils de nettoyage et deduplication', status: 'planned' },
    ],
  },
] as const

export function SuperAdminCapabilities() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {CAPABILITY_GROUPS.map(group => {
        const Icon = group.icon
        return (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-[#1B3A6B]" />
                {group.title}
              </CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {group.items.map(item => {
                  const meta = STATUS_META[item.status]
                  return (
                    <li key={item.label} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        {item.hint && (
                          <p className="text-xs text-muted-foreground">{item.hint}</p>
                        )}
                      </div>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
