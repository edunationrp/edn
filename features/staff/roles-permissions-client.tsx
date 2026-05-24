'use client'

import { useMemo, useState, useTransition, useCallback, Fragment, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Shield, Users, Grid3X3, UserPlus, GitCompare, Check, X, Minus,
  ChevronDown, ChevronUp, Search, Crown, Sparkles,
  RefreshCw, ArrowLeftRight,
  UnfoldVertical, FoldVertical, Eye,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { notify } from '@/lib/feedback/toast'
import { cn, copyToClipboard } from '@/lib/utils'
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
import { StaffInvitationsPanel } from '@/features/staff/staff-invitations-panel'
import { StaffTeamTable } from '@/features/staff/staff-team-table'
import {
  cancelStaffInvitation,
  createStaffInvitation,
  resendStaffInvitationEmail,
  setStaffMemberActive,
  updateStaffMemberRole,
} from '@/lib/actions/staff'
import { ROLE_PERMISSIONS } from '@/types/permissions'

type TabId = 'overview' | 'matrix' | 'team' | 'invitations' | 'compare'

type ConfirmState =
  | { type: 'deactivate'; memberId: string; memberName: string }
  | { type: 'cancel-invite'; inviteId: string; label: string }
  | { type: 'change-role'; memberId: string; memberName: string; newRole: UserRole; oldRole: UserRole }
  | null

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
  const [compareA, setCompareA] = useState<UserRole>('PROVISEUR')
  const [compareB, setCompareB] = useState<UserRole>('PROFESSEUR')

  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [roleDetailOpen, setRoleDetailOpen] = useState(false)

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') params.delete('tab')
    else params.set('tab', tab)
    const qs = params.toString()
    router.replace(qs ? `/dashboard/staff/roles-permissions?${qs}` : '/dashboard/staff/roles-permissions', {
      scroll: false,
    })
  }, [router, searchParams])

  const focusRoleInMatrix = useCallback((role: UserRole) => {
    setSelectedRoleDetail(role)
    setMatrixRoles(prev => (prev.includes(role) ? prev : [...prev, role]))
    setSearchQuery('')
    handleTabChange('matrix')
  }, [handleTabChange])

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
    actionKey: string,
    action: () => Promise<{
      error?: string
      success?: boolean
      inviteUrl?: string
      emailSent?: boolean
      emailWarning?: string
      reused?: boolean
    }>,
    successMsg: string,
    onSuccess?: (result: { inviteUrl?: string; emailSent?: boolean; emailWarning?: string; reused?: boolean }) => void
  ) => {
    setPendingKey(actionKey)
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) {
          notify.error(result.error, 'staff')
          return
        }

        if (result.emailWarning) {
          notify.success(successMsg, { description: result.emailWarning })
        } else if (result.reused) {
          notify.success('Invitation mise à jour', {
            description: result.emailSent
              ? 'Lien renvoyé par email.'
              : 'Le lien existant a été prolongé — copiez-le si besoin.',
          })
        } else {
          notify.success(successMsg)
        }

        if (result.inviteUrl) setLastInviteUrl(result.inviteUrl)
        onSuccess?.(result)
        router.refresh()
      } finally {
        setPendingKey(null)
      }
    })
  }, [router])

  async function handleCopyInviteUrl(url: string) {
    const ok = await copyToClipboard(url)
    if (ok) notify.success('Lien copié dans le presse-papiers')
    else notify.error('Impossible de copier le lien — copiez-le manuellement.')
  }

  function toggleMatrixRole(role: UserRole) {
    setMatrixRoles(prev => {
      if (prev.includes(role)) {
        if (prev.length <= 1) {
          notify.warning('Au moins une colonne doit rester visible.')
          return prev
        }
        return prev.filter(r => r !== role)
      }
      return [...prev, role]
    })
  }

  function expandAllGroups(expand: boolean) {
    const next = PERMISSION_GROUPS.reduce((acc, g) => {
      acc[g.id] = expand
      return acc
    }, {} as Record<string, boolean>)
    setExpandedGroups(next)
  }

  function handleConfirmAction() {
    if (!confirmState) return

    if (confirmState.type === 'deactivate') {
      runAction(
        `deactivate-${confirmState.memberId}`,
        () => setStaffMemberActive(confirmState.memberId, false),
        'Membre désactivé',
        () => setConfirmState(null)
      )
      return
    }

    if (confirmState.type === 'cancel-invite') {
      runAction(
        `cancel-${confirmState.inviteId}`,
        () => cancelStaffInvitation(confirmState.inviteId),
        'Invitation annulée',
        () => setConfirmState(null)
      )
      return
    }

    if (confirmState.type === 'change-role') {
      runAction(
        `role-${confirmState.memberId}`,
        () => updateStaffMemberRole(confirmState.memberId, confirmState.newRole),
        'Rôle mis à jour',
        () => setConfirmState(null)
      )
    }
  }

  function toggleGroup(id: string) {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const pendingInvites = data.invitations.filter(i => i.status === 'pending')
  const proviseurCoverage = getPermissionCoverage('PROVISEUR')

  const rolePermissionGroups = useMemo(() => {
    const rolePerms = new Set(ROLE_PERMISSIONS[selectedRoleDetail] ?? [])
    return PERMISSION_GROUPS
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(perm => rolePerms.has(perm.key)),
      }))
      .filter(group => group.permissions.length > 0)
  }, [selectedRoleDetail])

  const selectedRoleCoverage = getPermissionCoverage(selectedRoleDetail)
  const selectedRoleMemberCount = data.roleCounts[selectedRoleDetail] ?? 0

  return (
    <div className="space-y-4">
      {activeTab !== 'invitations' && (
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
              { label: 'Membres', value: data.members.filter(m => m.isActive).length, tab: 'team' as TabId },
              { label: 'Rôles actifs', value: Object.keys(data.roleCounts).length, tab: 'overview' as TabId },
              { label: 'Invitations', value: pendingInvites.length, tab: 'invitations' as TabId },
            ].map(stat => (
              <button
                key={stat.label}
                type="button"
                onClick={() => handleTabChange(stat.tab)}
                className="rounded-xl border bg-white/80 px-3 py-2 text-center backdrop-blur-sm transition-all hover:border-[#1a4d2e]/30 hover:shadow-sm"
              >
                <p className="text-xl font-bold text-[#1a4d2e]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              </button>
            ))}
          </div>
        </div>
        <Shield className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-[#1a4d2e]/5" />
      </div>
      )}

      <Tabs value={activeTab} onValueChange={v => handleTabChange(v as TabId)}>
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
              const isDirector = role === 'PROVISEUR'
              return (
                <div
                  key={role}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => focusRoleInMatrix(role)}
                    >
                      <Grid3X3 className="h-3 w-3" />
                      Matrice
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => {
                        setSelectedRoleDetail(role)
                        setRoleDetailOpen(true)
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      Détails
                    </Button>
                  </div>
                </div>
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
                  onClick={() => handleTabChange('invitations')}
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
              <div className="flex flex-wrap items-center gap-2">
                <Label className="w-full text-xs text-muted-foreground sm:w-auto">Colonnes :</Label>
                {MATRIX_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleMatrixRole(role)}
                    aria-pressed={matrixRoles.includes(role)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      matrixRoles.includes(role)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
                <div className="ml-auto flex gap-1">
                  <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => expandAllGroups(true)}>
                    <UnfoldVertical className="h-3 w-3" />
                    Tout ouvrir
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => expandAllGroups(false)}>
                    <FoldVertical className="h-3 w-3" />
                    Tout fermer
                  </Button>
                </div>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Aucune permission ne correspond à « {searchQuery} »
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-4">
          <StaffTeamTable
            members={data.members}
            canActivate={data.canActivate}
            canDeactivate={data.canDeactivate}
            isPending={isPending}
            pendingKey={pendingKey}
            onRoleChange={payload =>
              setConfirmState({
                type: 'change-role',
                memberId: payload.memberId,
                memberName: payload.memberName,
                oldRole: payload.oldRole,
                newRole: payload.newRole,
              })
            }
            onRequestDeactivate={(memberId, memberName) =>
              setConfirmState({ type: 'deactivate', memberId, memberName })
            }
            onActivate={memberId =>
              runAction(
                `active-${memberId}`,
                () => setStaffMemberActive(memberId, true),
                'Membre activé'
              )
            }
          />
        </TabsContent>

        {/* INVITATIONS */}
        <TabsContent value="invitations" className="space-y-4">
          <StaffInvitationsPanel
            canInvite={data.canInvite}
            schoolName={data.schoolName}
            appUrl={data.appUrl}
            invitations={data.invitations}
            isPending={isPending}
            pendingKey={pendingKey}
            lastInviteUrl={lastInviteUrl}
            onCopyUrl={handleCopyInviteUrl}
            onCreateInvite={payload =>
              runAction(
                'create-invite',
                () => createStaffInvitation(payload),
                payload.sendEmail && payload.invitedEmail
                  ? 'Invitation créée'
                  : 'Invitation créée — copiez le lien',
                r => { if (r.inviteUrl) setLastInviteUrl(r.inviteUrl) }
              )
            }
            onResend={inviteId =>
              runAction(
                `resend-${inviteId}`,
                () => resendStaffInvitationEmail(inviteId),
                'Relance traitée',
                r => {
                  if (r.inviteUrl) setLastInviteUrl(r.inviteUrl)
                }
              )
            }
            onCancel={invite =>
              setConfirmState({
                type: 'cancel-invite',
                inviteId: invite.id,
                label: invite.invitedName || invite.invitedEmail || 'cette invitation',
              })
            }
          />
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
                  <div className="flex items-center justify-between">
                    <Label>Rôle B</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                      onClick={() => {
                        setCompareA(compareB)
                        setCompareB(compareA)
                      }}
                      aria-label="Inverser les rôles"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Inverser
                    </Button>
                  </div>
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

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={open => { if (!open) setConfirmState(null) }}
        title={
          confirmState?.type === 'deactivate'
            ? 'Désactiver ce membre ?'
            : confirmState?.type === 'cancel-invite'
              ? 'Annuler l\'invitation ?'
              : 'Changer le rôle ?'
        }
        description={
          confirmState?.type === 'deactivate'
            ? `${confirmState.memberName} ne pourra plus accéder à l'établissement tant que son compte est inactif.`
            : confirmState?.type === 'cancel-invite'
              ? `Le lien d'invitation pour ${confirmState.label} ne sera plus utilisable.`
              : confirmState
                ? `Attribuer le rôle « ${ROLE_LABELS[confirmState.newRole]} » à ${confirmState.memberName} (actuellement ${ROLE_LABELS[confirmState.oldRole]}) ?`
                : ''
        }
        confirmLabel={
          confirmState?.type === 'deactivate'
            ? 'Désactiver'
            : confirmState?.type === 'cancel-invite'
              ? 'Annuler l\'invitation'
              : 'Confirmer le changement'
        }
        variant={confirmState?.type === 'deactivate' || confirmState?.type === 'cancel-invite' ? 'destructive' : 'default'}
        loading={!!pendingKey && !!confirmState}
        onConfirm={handleConfirmAction}
      />

      <Dialog open={roleDetailOpen} onOpenChange={setRoleDetailOpen}>
        <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <div className="border-b border-slate-200 bg-slate-50 px-6 pb-5 pt-6">
            <DialogHeader className="space-y-3 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('shrink-0', ROLE_COLORS[selectedRoleDetail])}>
                  {ROLE_LABELS[selectedRoleDetail]}
                </Badge>
                {selectedRoleDetail === 'PROVISEUR' && (
                  <Crown className="h-4 w-4 text-[#1a4d2e]" />
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Détails du rôle
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-600">
                {ROLE_DESCRIPTIONS[selectedRoleDetail]}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Couverture
                </p>
                <p className="mt-0.5 text-lg font-bold text-[#1B3A6B]">
                  {selectedRoleCoverage.percent}%
                </p>
                <p className="text-xs text-slate-500">
                  {selectedRoleCoverage.granted}/{selectedRoleCoverage.total} permissions
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Membres actifs
                </p>
                <p className="mt-0.5 text-lg font-bold text-[#1a4d2e]">
                  {selectedRoleMemberCount}
                </p>
                <p className="text-xs text-slate-500">
                  dans votre établissement
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <CoverageBar role={selectedRoleDetail} />
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-white px-6 py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Permissions accordées</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Droits regroupés par domaine fonctionnel
              </p>
            </div>

            {rolePermissionGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                Aucune permission définie pour ce rôle.
              </div>
            ) : (
              <div className="space-y-3">
                {rolePermissionGroups.map(group => (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div className="border-b border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-[#1B3A6B]">{group.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                    </div>
                    <ul className="divide-y divide-slate-200/80 bg-white">
                      {group.permissions.map(perm => (
                        <li
                          key={perm.key}
                          className="flex items-start gap-3 px-4 py-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Check className="h-3 w-3" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{perm.label}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{perm.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleDetailOpen(false)}
            >
              Fermer
            </Button>
            <Button
              type="button"
              variant="brandDark"
              onClick={() => {
                setRoleDetailOpen(false)
                focusRoleInMatrix(selectedRoleDetail)
              }}
            >
              <Grid3X3 className="h-4 w-4" />
              Voir dans la matrice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

