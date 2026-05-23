'use client'

import { useMemo, useState, useTransition, useCallback, Fragment, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, Users, Grid3X3, UserPlus, GitCompare, Check, X, Minus,
  Copy, Mail, ChevronDown, ChevronUp, Search, Crown, Sparkles,
  Link2, Ban, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { notify } from '@/lib/feedback/toast'
import { getInitials, formatDate, cn } from '@/lib/utils'
import {
  PERMISSION_GROUPS,
  MATRIX_ROLES,
  INVITABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_COLORS,
  getPermissionCoverage,
  roleHasPermission,
} from '@/lib/permissions/catalog'
import type { Permission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import type { RolesPermissionsPayload } from '@/features/staff/roles-permissions-types'
import {
  cancelStaffInvitation,
  createStaffInvitation,
  setStaffMemberActive,
  updateStaffMemberRole,
} from '@/lib/actions/staff'

type TabId = 'overview' | 'matrix' | 'team' | 'invitations' | 'compare'

const TAB_ITEMS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'matrix', label: 'Matrice', icon: <Grid3X3 className="h-4 w-4" /> },
  { id: 'team', label: 'Équipe', icon: <Users className="h-4 w-4" /> },
  { id: 'invitations', label: 'Invitations', icon: <UserPlus className="h-4 w-4" /> },
  { id: 'compare', label: 'Comparer', icon: <GitCompare className="h-4 w-4" /> },
]

function PermissionChip({ granted, compact }: { granted: boolean; compact?: boolean }) {
  if (compact) {
    return granted
      ? <Check className="mx-auto h-4 w-4 text-green-600" />
      : <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
  }
  return granted
    ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          <Check className="h-3 w-3" /> Oui
        </span>
      )
    : (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          <X className="h-3 w-3" /> Non
        </span>
      )
}

function CoverageBar({ role }: { role: UserRole }) {
  const { granted, total, percent } = getPermissionCoverage(role)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{granted}/{total} permissions</span>
        <span className="font-semibold text-[#1B3A6B]">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            role === 'PROVISEUR' ? 'bg-gradient-to-r from-[#1a4d2e] to-[#2d6a4f]' : 'bg-primary/70'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function RolesPermissionsClient({ data }: { data: RolesPermissionsPayload }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const initialTab = (searchParams.get('tab') as TabId) || 'overview'
  const [activeTab, setActiveTab] = useState<TabId>(
    TAB_ITEMS.some(t => t.id === initialTab) ? initialTab : 'overview'
  )

  useEffect(() => {
    const tab = searchParams.get('tab') as TabId
    if (tab && TAB_ITEMS.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const [searchQuery, setSearchQuery] = useState('')
  const [matrixRoles, setMatrixRoles] = useState<UserRole[]>([
    'PROVISEUR', 'CENSEUR', 'INTENDANT', 'SECRETAIRE', 'PROFESSEUR',
  ])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    staff: true,
    grades: true,
    finance: true,
  })
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<UserRole>('PROVISEUR')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [compareA, setCompareA] = useState<UserRole>('PROVISEUR')
  const [compareB, setCompareB] = useState<UserRole>('PROFESSEUR')

  const [inviteForm, setInviteForm] = useState({
    roleCode: 'PROFESSEUR' as string,
    email: '',
    name: '',
    sendEmail: true,
  })
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return PERMISSION_GROUPS
    return PERMISSION_GROUPS.map(group => ({
      ...group,
      permissions: group.permissions.filter(
        p => p.label.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q)
      ),
    })).filter(g => g.permissions.length > 0)
  }, [searchQuery])

  const filteredMembers = useMemo(() => {
    if (teamFilter === 'all') return data.members
    if (teamFilter === 'active') return data.members.filter(m => m.isActive)
    if (teamFilter === 'inactive') return data.members.filter(m => !m.isActive)
    return data.members.filter(m => m.roleCode === teamFilter)
  }, [data.members, teamFilter])

  const compareDiff = useMemo(() => {
    const onlyA: Permission[] = []
    const onlyB: Permission[] = []
    const shared: Permission[] = []
    for (const group of PERMISSION_GROUPS) {
      for (const perm of group.permissions) {
        const a = roleHasPermission(compareA, perm.key)
        const b = roleHasPermission(compareB, perm.key)
        if (a && b) shared.push(perm.key)
        else if (a) onlyA.push(perm.key)
        else if (b) onlyB.push(perm.key)
      }
    }
    return { onlyA, onlyB, shared }
  }, [compareA, compareB])

  const runAction = useCallback((
    action: () => Promise<{ error?: string; success?: boolean; inviteUrl?: string }>,
    successMsg: string,
    onSuccess?: (result: { inviteUrl?: string }) => void
  ) => {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        notify.error(result.error, 'staff')
        return
      }
      notify.success(successMsg)
      if (result.inviteUrl) setLastInviteUrl(result.inviteUrl)
      onSuccess?.(result)
      router.refresh()
    })
  }, [router])

  async function copyInviteUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      notify.success('Lien copié dans le presse-papiers')
    } catch {
      notify.error('Impossible de copier le lien')
    }
  }

  function toggleGroup(id: string) {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const pendingInvites = data.invitations.filter(i => i.status === 'pending')
  const proviseurCoverage = getPermissionCoverage('PROVISEUR')

  return (
    <div className="space-y-4">
      {/* Hero directeur */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1a4d2e]/20 bg-gradient-to-br from-[#1a4d2e]/10 via-white to-blue-50/50 p-4 sm:p-6">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1 bg-[#1a4d2e] hover:bg-[#1a4d2e]">
                <Crown className="h-3 w-3" />
                {data.currentRoleLabel}
              </Badge>
              <Badge variant="outline">{data.schoolName}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-bold text-[#1B3A6B] sm:text-xl">
              Contrôle total des accès
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              En tant que directeur, vous disposez de{' '}
              <strong className="text-foreground">{proviseurCoverage.granted} permissions</strong>{' '}
              sur {proviseurCoverage.total} — invitez votre équipe et pilotez qui peut faire quoi.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Membres', value: data.members.filter(m => m.isActive).length },
              { label: 'Rôles actifs', value: Object.keys(data.roleCounts).length },
              { label: 'Invitations', value: pendingInvites.length },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border bg-white/80 px-3 py-2 text-center backdrop-blur-sm">
                <p className="text-xl font-bold text-[#1a4d2e]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <Shield className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-[#1a4d2e]/5" />
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabId)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
          {TAB_ITEMS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.id === 'invitations' && pendingInvites.length > 0 && (
                <Badge variant="warning" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {pendingInvites.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MATRIX_ROLES.map(role => {
              const count = data.roleCounts[role] ?? 0
              const coverage = getPermissionCoverage(role)
              const isDirector = role === 'PROVISEUR'
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRoleDetail(role)
                    setActiveTab('matrix')
                  }}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                    isDirector && 'border-[#1a4d2e]/30 bg-[#1a4d2e]/5 ring-1 ring-[#1a4d2e]/10',
                    selectedRoleDetail === role && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={cn(ROLE_COLORS[role], 'shrink-0')}>
                      {ROLE_LABELS[role]}
                    </Badge>
                    {isDirector && <Crown className="h-4 w-4 text-[#1a4d2e]" />}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                  <div className="mt-3">
                    <CoverageBar role={role} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {count} membre{count !== 1 ? 's' : ''} actif{count !== 1 ? 's' : ''}
                  </p>
                </button>
              )
            })}
          </div>

          {data.canInvite && (
            <Card className="border-dashed border-[#1a4d2e]/30 bg-[#1a4d2e]/5">
              <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[#1B3A6B]">Inviter un membre rapidement</p>
                  <p className="text-sm text-muted-foreground">
                    Générez un lien sécurisé valable 7 jours pour un rôle précis.
                  </p>
                </div>
                <Button
                  className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f] sm:w-auto"
                  onClick={() => setActiveTab('invitations')}
                >
                  <UserPlus className="h-4 w-4" />
                  Nouvelle invitation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MATRIX */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Matrice des permissions</CardTitle>
                  <CardDescription>
                    Droits par rôle — le Proviseur a l&apos;accès le plus complet
                  </CardDescription>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une permission…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Label className="w-full text-xs text-muted-foreground">Colonnes affichées :</Label>
                {MATRIX_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() =>
                      setMatrixRoles(prev =>
                        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                      )
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      matrixRoles.includes(role)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted/30 text-muted-foreground'
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2.5 text-left font-medium">
                        Permission
                      </th>
                      {matrixRoles.map(role => (
                        <th key={role} className="px-2 py-2.5 text-center font-medium whitespace-nowrap">
                          <span className={cn(
                            'inline-block rounded px-1.5 py-0.5 text-xs',
                            role === 'PROVISEUR' && 'bg-[#1a4d2e]/10 font-bold text-[#1a4d2e]'
                          )}>
                            {ROLE_LABELS[role].split(' ')[0]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map(group => (
                      <Fragment key={group.id}>
                        <tr
                          className="cursor-pointer border-b bg-muted/20 hover:bg-muted/30"
                          onClick={() => toggleGroup(group.id)}
                        >
                          <td colSpan={matrixRoles.length + 1} className="px-3 py-2">
                            <div className="flex items-center gap-2 font-semibold text-[#1B3A6B]">
                              {expandedGroups[group.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              {group.label}
                              <span className="text-xs font-normal text-muted-foreground">
                                — {group.description}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedGroups[group.id] && group.permissions.map(perm => (
                          <tr key={perm.key} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="sticky left-0 z-10 bg-background px-3 py-2">
                              <p className="font-medium">{perm.label}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </td>
                            {matrixRoles.map(role => (
                              <td key={`${perm.key}-${role}`} className="px-2 py-2 text-center">
                                <PermissionChip granted={roleHasPermission(role, perm.key)} compact />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les membres</SelectItem>
                <SelectItem value="active">Actifs seulement</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                {INVITABLE_ROLES.map(role => (
                  <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/staff">Vue liste classique</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {filteredMembers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun membre pour ce filtre.
                </CardContent>
              </Card>
            ) : (
              filteredMembers.map(member => {
                const canEdit = (data.canActivate || data.canDeactivate) &&
                  !member.isCurrentUser &&
                  member.roleCode !== 'PROVISEUR' &&
                  member.roleCode !== 'FONDATEUR'

                return (
                  <Card key={member.id} className={cn(!member.isActive && 'opacity-70')}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {getInitials(member.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold">{member.fullName}</p>
                              {member.isCurrentUser && (
                                <Badge variant="outline" className="text-[10px]">Vous</Badge>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{member.email || '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              Depuis {formatDate(member.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          <div className="flex flex-wrap gap-2">
                            <Badge className={ROLE_COLORS[member.roleCode]}>
                              {ROLE_LABELS[member.roleCode]}
                            </Badge>
                            <Badge variant={member.isActive ? 'success' : 'secondary'}>
                              {member.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>

                          {canEdit && (
                            <div className="flex flex-wrap items-center gap-2">
                              <Select
                                value={member.roleCode}
                                onValueChange={newRole =>
                                  runAction(
                                    () => updateStaffMemberRole(member.id, newRole),
                                    'Rôle mis à jour'
                                  )
                                }
                                disabled={isPending}
                              >
                                <SelectTrigger className="h-8 w-[140px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INVITABLE_ROLES.map(role => (
                                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2 rounded-lg border px-2 py-1">
                                <Label htmlFor={`active-${member.id}`} className="text-xs">
                                  Actif
                                </Label>
                                <Switch
                                  id={`active-${member.id}`}
                                  checked={member.isActive}
                                  disabled={isPending}
                                  onCheckedChange={v =>
                                    runAction(
                                      () => setStaffMemberActive(member.id, v),
                                      v ? 'Membre activé' : 'Membre désactivé'
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* INVITATIONS */}
        <TabsContent value="invitations" className="space-y-4">
          {!data.canInvite ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                Vous n&apos;avez pas les droits pour créer des invitations.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Créer une invitation</CardTitle>
                  <CardDescription>
                    Lien sécurisé valable 7 jours — l&apos;invité choisit son mot de passe à l&apos;acceptation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      runAction(
                        () => createStaffInvitation({
                          roleCode: inviteForm.roleCode,
                          invitedEmail: inviteForm.email || undefined,
                          invitedName: inviteForm.name || undefined,
                          sendEmail: inviteForm.sendEmail && !!inviteForm.email,
                        }),
                        'Invitation créée',
                        r => { if (r.inviteUrl) setLastInviteUrl(r.inviteUrl) }
                      )
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Rôle attribué *</Label>
                        <Select
                          value={inviteForm.roleCode}
                          onValueChange={v => setInviteForm(f => ({ ...f, roleCode: v }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {INVITABLE_ROLES.map(role => (
                              <SelectItem key={role} value={role}>
                                <span className="flex items-center gap-2">
                                  {ROLE_LABELS[role]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTIONS[inviteForm.roleCode as UserRole]}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Nom (optionnel)</Label>
                        <Input
                          value={inviteForm.name}
                          onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Prénom Nom"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Email (optionnel — pour envoi automatique)</Label>
                        <Input
                          type="email"
                          value={inviteForm.email}
                          onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="collegue@ecole.bf"
                        />
                      </div>
                    </div>
                    <ToggleRowInvite
                      label="Envoyer l'email d'invitation"
                      checked={inviteForm.sendEmail}
                      onCheckedChange={v => setInviteForm(f => ({ ...f, sendEmail: v }))}
                      disabled={!inviteForm.email}
                    />
                    <Button type="submit" disabled={isPending} className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f] sm:w-auto">
                      <Link2 className="h-4 w-4" />
                      {isPending ? 'Création…' : 'Générer le lien d\'invitation'}
                    </Button>
                  </form>

                  {lastInviteUrl && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50/50 p-3">
                      <p className="text-xs font-medium text-green-800">Lien généré</p>
                      <p className="mt-1 break-all text-xs text-green-700">{lastInviteUrl}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => copyInviteUrl(lastInviteUrl)}
                      >
                        <Copy className="h-3 w-3" />
                        Copier le lien
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invitations en cours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.invitations.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Aucune invitation pour le moment.
                    </p>
                  ) : (
                    data.invitations.map(invite => {
                      const url = `${data.appUrl}/join/staff/${invite.token}`
                      const isExpired = new Date(invite.expiresAt) < new Date()
                      return (
                        <div
                          key={invite.id}
                          className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={ROLE_COLORS[invite.roleCode as UserRole]}>
                                {ROLE_LABELS[invite.roleCode as UserRole] ?? invite.roleCode}
                              </Badge>
                              <Badge variant={
                                invite.status === 'pending' && !isExpired ? 'warning'
                                  : invite.status === 'used' ? 'success'
                                    : 'secondary'
                              }>
                                {invite.status === 'pending' && isExpired ? 'Expirée' : invite.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm">
                              {invite.invitedName || invite.invitedEmail || 'Invitation ouverte'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expire le {formatDate(invite.expiresAt)}
                            </p>
                          </div>
                          {invite.status === 'pending' && !isExpired && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyInviteUrl(url)}
                              >
                                <Copy className="h-3 w-3" />
                                Copier
                              </Button>
                              {invite.invitedEmail && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={`mailto:${invite.invitedEmail}`}>
                                    <Mail className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                disabled={isPending}
                                onClick={() =>
                                  runAction(
                                    () => cancelStaffInvitation(invite.id),
                                    'Invitation annulée'
                                  )
                                }
                              >
                                <Ban className="h-3 w-3" />
                                Annuler
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* COMPARE */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparer deux rôles</CardTitle>
              <CardDescription>
                Visualisez les différences de permissions avant d&apos;assigner un rôle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rôle A</Label>
                  <Select value={compareA} onValueChange={v => setCompareA(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATRIX_ROLES.map(role => (
                        <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CoverageBar role={compareA} />
                </div>
                <div className="space-y-2">
                  <Label>Rôle B</Label>
                  <Select value={compareB} onValueChange={v => setCompareB(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATRIX_ROLES.map(role => (
                        <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CoverageBar role={compareB} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">
                  <p className="text-xs font-semibold uppercase text-green-800">Communes</p>
                  <p className="mt-1 text-2xl font-bold text-green-700">{compareDiff.shared.length}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                  <p className="text-xs font-semibold uppercase text-blue-800">
                    Uniquement {ROLE_LABELS[compareA].split(' ')[0]}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">{compareDiff.onlyA.length}</p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
                  <p className="text-xs font-semibold uppercase text-purple-800">
                    Uniquement {ROLE_LABELS[compareB].split(' ')[0]}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-purple-700">{compareDiff.onlyB.length}</p>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4" />
                    Voir le détail des différences
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {ROLE_LABELS[compareA]} vs {ROLE_LABELS[compareB]}
                    </DialogTitle>
                    <DialogDescription>
                      Permissions exclusives à chaque rôle
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-blue-700">Uniquement {ROLE_LABELS[compareA]}</p>
                      <ul className="mt-2 space-y-1">
                        {compareDiff.onlyA.length === 0 ? (
                          <li className="text-muted-foreground">—</li>
                        ) : compareDiff.onlyA.map(p => (
                          <li key={p} className="rounded bg-blue-50 px-2 py-1 text-xs">{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-purple-700">Uniquement {ROLE_LABELS[compareB]}</p>
                      <ul className="mt-2 space-y-1">
                        {compareDiff.onlyB.length === 0 ? (
                          <li className="text-muted-foreground">—</li>
                        ) : compareDiff.onlyB.map(p => (
                          <li key={p} className="rounded bg-purple-50 px-2 py-1 text-xs">{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ToggleRowInvite({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3">
      <p className="text-sm font-medium">{label}</p>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}
