'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  INVITABLE_ROLES,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from '@/lib/permissions/catalog'
import type { UserRole } from '@/types/roles'
import type { InvitationRow } from '@/features/staff/roles-permissions-types'
import {
  buildInviteMailto,
  cn,
  formatDate,
  formatRelativeDate,
  getInitials,
} from '@/lib/utils'

type InviteFilter = 'all' | 'pending' | 'used' | 'expired'

type InviteStatusMeta = {
  label: string
  variant: 'success' | 'warning' | 'secondary' | 'destructive'
  actionable: boolean
}

function resolveInviteStatus(invite: InvitationRow): InviteStatusMeta {
  const isExpired = new Date(invite.expiresAt) < new Date()

  if (invite.status === 'used') {
    return { label: 'Acceptée', variant: 'success', actionable: false }
  }
  if (invite.status === 'cancelled' || invite.status === 'canceled') {
    return { label: 'Annulée', variant: 'secondary', actionable: false }
  }
  if (invite.status === 'pending' && isExpired) {
    return { label: 'Expirée', variant: 'secondary', actionable: false }
  }
  if (invite.status === 'pending') {
    return { label: 'En attente', variant: 'warning', actionable: true }
  }

  return { label: invite.status, variant: 'secondary', actionable: false }
}

function countByFilter(invitations: InvitationRow[], filter: InviteFilter) {
  return invitations.filter(invite => {
    const status = resolveInviteStatus(invite)
    if (filter === 'all') return true
    if (filter === 'pending') return status.label === 'En attente'
    if (filter === 'used') return status.label === 'Acceptée'
    if (filter === 'expired') return status.label === 'Expirée' || status.label === 'Annulée'
    return true
  }).length
}

type StaffInvitationsPanelProps = {
  canInvite: boolean
  schoolName: string
  appUrl: string
  invitations: InvitationRow[]
  isPending: boolean
  pendingKey: string | null
  onCreateInvite: (payload: {
    roleCode: string
    invitedEmail?: string
    invitedName?: string
    sendEmail: boolean
  }) => void
  onCopyUrl: (url: string) => void
  onResend: (inviteId: string) => void
  onCancel: (invite: InvitationRow) => void
  lastInviteUrl: string | null
}

const FILTER_ITEMS: Array<{ id: InviteFilter; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'used', label: 'Acceptées' },
  { id: 'expired', label: 'Expirées' },
]

export function StaffInvitationsPanel({
  canInvite,
  schoolName,
  appUrl,
  invitations,
  isPending,
  pendingKey,
  onCreateInvite,
  onCopyUrl,
  onResend,
  onCancel,
  lastInviteUrl,
}: StaffInvitationsPanelProps) {
  const [inviteForm, setInviteForm] = useState({
    roleCode: 'PROFESSEUR' as string,
    email: '',
    name: '',
    sendEmail: true,
  })
  const [filter, setFilter] = useState<InviteFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const stats = useMemo(() => ({
    pending: countByFilter(invitations, 'pending'),
    used: countByFilter(invitations, 'used'),
    expired: countByFilter(invitations, 'expired'),
    total: invitations.length,
  }), [invitations])

  const filteredInvitations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return invitations.filter(invite => {
      const status = resolveInviteStatus(invite)
      if (filter === 'pending' && status.label !== 'En attente') return false
      if (filter === 'used' && status.label !== 'Acceptée') return false
      if (filter === 'expired' && status.label !== 'Expirée' && status.label !== 'Annulée') return false
      if (!q) return true

      const haystack = [
        invite.invitedName,
        invite.invitedEmail,
        ROLE_LABELS[invite.roleCode as UserRole],
        invite.roleCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [invitations, filter, searchQuery])

  if (!canInvite) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Accès restreint</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Vous n&apos;avez pas les droits pour créer ou gérer des invitations personnel.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'En attente', value: stats.pending, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
          { label: 'Acceptées', value: stats.used, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
          { label: 'Expirées / annulées', value: stats.expired, tone: 'text-slate-600 bg-slate-50 border-slate-200' },
          { label: 'Total', value: stats.total, tone: 'text-[#1B3A6B] bg-blue-50/80 border-blue-100' },
        ].map(stat => (
          <div
            key={stat.label}
            className={cn('rounded-xl border px-4 py-3', stat.tone)}
          >
            <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader className="border-b bg-slate-50/70 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a4d2e]/10 text-[#1a4d2e]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Nouvelle invitation</CardTitle>
                <CardDescription className="mt-1">
                  Lien sécurisé valable 7 jours — l&apos;invité définit son mot de passe à l&apos;acceptation.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form
              onSubmit={e => {
                e.preventDefault()
                onCreateInvite({
                  roleCode: inviteForm.roleCode,
                  invitedEmail: inviteForm.email || undefined,
                  invitedName: inviteForm.name || undefined,
                  sendEmail: inviteForm.sendEmail && !!inviteForm.email,
                })
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle attribué</Label>
                <Select
                  value={inviteForm.roleCode}
                  onValueChange={v => setInviteForm(f => ({ ...f, roleCode: v }))}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map(role => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  {ROLE_DESCRIPTIONS[inviteForm.roleCode as UserRole]}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-name">Nom de l&apos;invité</Label>
                <Input
                  id="invite-name"
                  value={inviteForm.name}
                  onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Prénom Nom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="collegue@ecole.bf"
                />
                <p className="text-xs text-muted-foreground">
                  Optionnel — permet l&apos;envoi automatique de l&apos;invitation par email.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">Envoyer par email</p>
                  <p className="text-xs text-muted-foreground">
                    {inviteForm.email ? 'Un message sera envoyé à l\'adresse saisie.' : 'Renseignez un email pour activer.'}
                  </p>
                </div>
                <Switch
                  checked={inviteForm.sendEmail}
                  onCheckedChange={v => setInviteForm(f => ({ ...f, sendEmail: v }))}
                  disabled={!inviteForm.email}
                />
              </div>

              <Button
                type="submit"
                variant="brandDark"
                className="w-full"
                disabled={isPending}
                loading={pendingKey === 'create-invite'}
              >
                <Link2 className="h-4 w-4" />
                Générer le lien d&apos;invitation
              </Button>
            </form>

            {lastInviteUrl && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900">Invitation prête</p>
                    <p className="mt-1 break-all rounded-lg bg-white/80 px-2.5 py-2 font-mono text-[11px] text-emerald-800 ring-1 ring-emerald-100">
                      {lastInviteUrl}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onCopyUrl(lastInviteUrl)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copier
                      </Button>
                      <Button type="button" size="sm" variant="outline" asChild>
                        <a href={lastInviteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ouvrir
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader className="space-y-4 border-b pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Invitations</CardTitle>
                <CardDescription>
                  Suivez les liens envoyés à votre équipe — {schoolName}
                </CardDescription>
              </div>
              <div className="relative w-full sm:max-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTER_ITEMS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    filter === item.id
                      ? 'border-[#1a4d2e] bg-[#1a4d2e]/10 text-[#1a4d2e]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {countByFilter(invitations, item.id)}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {filteredInvitations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  {searchQuery ? <Search className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {searchQuery ? 'Aucun résultat' : 'Aucune invitation'}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    {searchQuery
                      ? `Aucune invitation ne correspond à « ${searchQuery} ».`
                      : 'Créez un lien d\'invitation pour ajouter un membre à votre établissement.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInvitations.map(invite => (
                  <InvitationRowCard
                    key={invite.id}
                    invite={invite}
                    appUrl={appUrl}
                    schoolName={schoolName}
                    isPending={isPending}
                    pendingKey={pendingKey}
                    onCopyUrl={onCopyUrl}
                    onResend={onResend}
                    onCancel={onCancel}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InvitationRowCard({
  invite,
  appUrl,
  schoolName,
  isPending,
  pendingKey,
  onCopyUrl,
  onResend,
  onCancel,
}: {
  invite: InvitationRow
  appUrl: string
  schoolName: string
  isPending: boolean
  pendingKey: string | null
  onCopyUrl: (url: string) => void
  onResend: (inviteId: string) => void
  onCancel: (invite: InvitationRow) => void
}) {
  const url = `${appUrl}/join/staff/${invite.token}`
  const status = resolveInviteStatus(invite)
  const displayName = invite.invitedName || invite.invitedEmail || 'Invitation ouverte'
  const initials = getInitials(invite.invitedName || invite.invitedEmail || '?')
  const role = invite.roleCode as UserRole
  const expiresSoon =
    status.label === 'En attente' &&
    new Date(invite.expiresAt).getTime() - Date.now() < 48 * 60 * 60 * 1000

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white">
          <AvatarFallback className="bg-[#1B3A6B]/10 text-xs font-bold text-[#1B3A6B]">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{displayName}</p>
            <Badge className={cn('shrink-0', ROLE_COLORS[role])}>
              {ROLE_LABELS[role] ?? invite.roleCode}
            </Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {invite.invitedEmail && invite.invitedName && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{invite.invitedEmail}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expire le {formatDate(invite.expiresAt)}
            </span>
            {status.label === 'En attente' && (
              <span className={cn(expiresSoon && 'font-medium text-amber-700')}>
                {formatRelativeDate(invite.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {status.actionable ? (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopyUrl(url)}
          >
            <Copy className="h-3.5 w-3.5" />
            Copier
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-9 w-9 px-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir le lien
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyUrl(url)}>
                <Copy className="h-4 w-4" />
                Copier le lien
              </DropdownMenuItem>
              {invite.invitedEmail && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href={buildInviteMailto(
                        invite.invitedEmail,
                        schoolName,
                        ROLE_LABELS[role] ?? invite.roleCode,
                        url
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      Envoyer par email
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isPending}
                    onClick={() => onResend(invite.id)}
                  >
                    <RefreshCw className={cn('h-4 w-4', pendingKey === `resend-${invite.id}` && 'animate-spin')} />
                    Renvoyer l&apos;email
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                disabled={isPending}
                onClick={() => onCancel(invite)}
              >
                <Ban className="h-4 w-4" />
                Annuler l&apos;invitation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {status.label === 'Acceptée' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Compte créé
            </span>
          )}
          {(status.label === 'Expirée' || status.label === 'Annulée') && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" disabled>
              <Send className="h-3.5 w-3.5" />
              Inactive
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
