'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FilterBar, FilterSearch } from '@/components/dashboard/filter-bar'
import { INVITABLE_ROLES, ROLE_COLORS, ROLE_LABELS } from '@/lib/permissions/catalog'
import type { UserRole } from '@/types/roles'
import type { StaffMemberRow } from '@/features/staff/roles-permissions-types'
import { canRemoveStaffMember } from '@/lib/staff/member-removal'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

type TeamFilter = 'all' | 'active' | 'inactive' | UserRole

type StaffTeamTableProps = {
  members: StaffMemberRow[]
  canActivate: boolean
  canDeactivate: boolean
  canRemove: boolean
  isPending: boolean
  pendingKey: string | null
  onRoleChange: (payload: {
    memberId: string
    memberName: string
    oldRole: UserRole
    newRole: UserRole
  }) => void
  onRequestDeactivate: (memberId: string, memberName: string) => void
  onRequestRemove: (memberId: string, memberName: string) => void
  onActivate: (memberId: string) => void
}

const FILTER_OPTIONS: Array<{ value: TeamFilter; label: string }> = [
  { value: 'all', label: 'Tous les membres' },
  { value: 'active', label: 'Actifs seulement' },
  { value: 'inactive', label: 'Inactifs' },
  ...INVITABLE_ROLES.map(role => ({
    value: role as TeamFilter,
    label: ROLE_LABELS[role],
  })),
]

function canEditMember(
  member: StaffMemberRow,
  canActivate: boolean,
  canDeactivate: boolean
) {
  return (canActivate || canDeactivate) &&
    !member.isCurrentUser &&
    member.roleCode !== 'PROVISEUR' &&
    member.roleCode !== 'FONDATEUR'
}

export function StaffTeamTable({
  members,
  canActivate,
  canDeactivate,
  canRemove,
  isPending,
  pendingKey,
  onRoleChange,
  onRequestDeactivate,
  onRequestRemove,
  onActivate,
}: StaffTeamTableProps) {
  const [filter, setFilter] = useState<TeamFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return members.filter(member => {
      if (filter === 'active' && !member.isActive) return false
      if (filter === 'inactive' && member.isActive) return false
      if (filter !== 'all' && filter !== 'active' && filter !== 'inactive' && member.roleCode !== filter) {
        return false
      }

      if (!q) return true

      const haystack = [
        member.fullName,
        member.email,
        member.phone,
        ROLE_LABELS[member.roleCode],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [members, filter, searchQuery])

  return (
    <div className={cn(dashboard.card, 'overflow-hidden')}>
      <FilterBar className="gap-3 border-slate-100 bg-white p-4 sm:px-5">
        <FilterSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un membre…"
          icon={<Search className="h-4 w-4" />}
        />
        <Select value={filter} onValueChange={v => setFilter(v as TeamFilter)}>
          <SelectTrigger className="h-10 w-full shrink-0 rounded-xl border-slate-200 bg-white sm:w-52">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" asChild className="h-10 w-full shrink-0 sm:w-auto">
          <Link href="/dashboard/staff">Vue liste classique</Link>
        </Button>
      </FilterBar>

      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {searchQuery ? 'Aucun résultat' : 'Aucun membre'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery
                ? `Aucun membre ne correspond à « ${searchQuery} ».`
                : 'Ajustez le filtre ou invitez du personnel.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className={dashboard.tableWrap}>
              <table className="w-full min-w-[720px] text-sm">
                <thead className={dashboard.tableHead}>
                  <tr>
                    <th className={cn(dashboard.label, 'px-5 py-3 text-left')}>Membre</th>
                    <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Rôle</th>
                    <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Statut</th>
                    <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Inscription</th>
                    {(canActivate || canDeactivate || canRemove) && (
                      <th className={cn(dashboard.label, 'px-5 py-3 text-right')}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <DesktopMemberRow
                      key={member.id}
                      member={member}
                      canActivate={canActivate}
                      canDeactivate={canDeactivate}
                      canRemove={canRemove}
                      isPending={isPending}
                      pendingKey={pendingKey}
                      onRoleChange={onRoleChange}
                      onRequestDeactivate={onRequestDeactivate}
                      onRequestRemove={onRequestRemove}
                      onActivate={onActivate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filteredMembers.map(member => (
              <MobileMemberRow
                key={member.id}
                member={member}
                canActivate={canActivate}
                canDeactivate={canDeactivate}
                canRemove={canRemove}
                isPending={isPending}
                pendingKey={pendingKey}
                onRoleChange={onRoleChange}
                onRequestDeactivate={onRequestDeactivate}
                onRequestRemove={onRequestRemove}
                onActivate={onActivate}
              />
            ))}
          </div>
        </>
      )}

      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
        <span>
          {filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''}
          {filter !== 'all' || searchQuery ? ' affiché(s)' : ''}
        </span>
      </div>
    </div>
  )
}

function MemberAvatar({ name, inactive }: { name: string; inactive?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B]/10 text-xs font-bold text-[#1B3A6B] ring-2 ring-white',
        inactive && 'opacity-60'
      )}
    >
      {getInitials(name)}
    </div>
  )
}

function MemberIdentity({
  member,
  compact,
}: {
  member: StaffMemberRow
  compact?: boolean
}) {
  return (
    <div className={cn('min-w-0', compact && 'flex-1')}>
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn('truncate font-semibold text-slate-900', compact ? 'text-sm' : 'text-base')}>
          {member.fullName}
        </p>
        {member.isCurrentUser && (
          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
            Vous
          </Badge>
        )}
      </div>
      <p className="mt-0.5 truncate text-sm text-slate-500">{member.email || '—'}</p>
      {member.phone && (
        <p className="mt-0.5 truncate text-xs text-slate-400">{member.phone}</p>
      )}
    </div>
  )
}

function canRemoveMember(member: StaffMemberRow, canRemove: boolean) {
  return canRemoveStaffMember({
    canRemove,
    isCurrentUser: member.isCurrentUser,
    roleCode: member.roleCode,
  })
}

function MemberActions({
  member,
  canActivate,
  canDeactivate,
  canRemove,
  isPending,
  pendingKey,
  onRoleChange,
  onRequestDeactivate,
  onRequestRemove,
  onActivate,
  layout,
}: {
  member: StaffMemberRow
  canActivate: boolean
  canDeactivate: boolean
  canRemove: boolean
  isPending: boolean
  pendingKey: string | null
  onRoleChange: StaffTeamTableProps['onRoleChange']
  onRequestDeactivate: StaffTeamTableProps['onRequestDeactivate']
  onRequestRemove: StaffTeamTableProps['onRequestRemove']
  onActivate: StaffTeamTableProps['onActivate']
  layout: 'desktop' | 'mobile'
}) {
  const editable = canEditMember(member, canActivate, canDeactivate)
  const removable = canRemoveMember(member, canRemove)
  if (!editable && !removable) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        layout === 'desktop' && 'justify-end',
        layout === 'mobile' && 'w-full flex-wrap rounded-xl border border-slate-200 bg-slate-50/80 p-3'
      )}
    >
      {editable && (
        <>
          <Select
            key={`${member.id}-${member.roleCode}-${layout}`}
            value={member.roleCode}
            onValueChange={newRole => {
              if (newRole === member.roleCode) return
              onRoleChange({
                memberId: member.id,
                memberName: member.fullName,
                oldRole: member.roleCode,
                newRole: newRole as UserRole,
              })
            }}
            disabled={isPending}
          >
            <SelectTrigger className={cn(
              'h-9 rounded-lg border-slate-200 bg-white text-xs',
              layout === 'desktop' ? 'w-[160px]' : 'min-w-0 flex-1'
            )}>
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

          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <Label htmlFor={`active-${member.id}-${layout}`} className="text-xs text-slate-600">
              Actif
            </Label>
            <Switch
              id={`active-${member.id}-${layout}`}
              checked={member.isActive}
              disabled={isPending || pendingKey === `active-${member.id}`}
              onCheckedChange={v => {
                if (v) {
                  onActivate(member.id)
                  return
                }
                onRequestDeactivate(member.id, member.fullName)
              }}
            />
          </div>
        </>
      )}

      {removable && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Retirer de l'établissement"
          className="h-9 shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={isPending || pendingKey === `remove-${member.id}`}
          onClick={() => onRequestRemove(member.id, member.fullName)}
        >
          <Trash2 className="h-4 w-4" />
          {layout === 'mobile' && <span>Retirer</span>}
        </Button>
      )}
    </div>
  )
}

function DesktopMemberRow({
  member,
  canActivate,
  canDeactivate,
  canRemove,
  isPending,
  pendingKey,
  onRoleChange,
  onRequestDeactivate,
  onRequestRemove,
  onActivate,
}: {
  member: StaffMemberRow
  canActivate: boolean
  canDeactivate: boolean
  canRemove: boolean
  isPending: boolean
  pendingKey: string | null
  onRoleChange: StaffTeamTableProps['onRoleChange']
  onRequestDeactivate: StaffTeamTableProps['onRequestDeactivate']
  onRequestRemove: StaffTeamTableProps['onRequestRemove']
  onActivate: StaffTeamTableProps['onActivate']
}) {
  const showActions =
    canActivate || canDeactivate || canRemove

  return (
    <tr className={cn(dashboard.tableRow, !member.isActive && 'opacity-75')}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.fullName} inactive={!member.isActive} />
          <MemberIdentity member={member} />
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge className={ROLE_COLORS[member.roleCode]}>
          {ROLE_LABELS[member.roleCode]}
        </Badge>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={member.isActive ? 'success' : 'secondary'}>
          {member.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </td>
      <td className="px-4 py-3.5 text-slate-500">
        {formatDate(member.createdAt)}
      </td>
      {showActions && (
        <td className="px-5 py-3.5">
          <MemberActions
            member={member}
            canActivate={canActivate}
            canDeactivate={canDeactivate}
            canRemove={canRemove}
            isPending={isPending}
            pendingKey={pendingKey}
            onRoleChange={onRoleChange}
            onRequestDeactivate={onRequestDeactivate}
            onRequestRemove={onRequestRemove}
            onActivate={onActivate}
            layout="desktop"
          />
        </td>
      )}
    </tr>
  )
}

function MobileMemberRow({
  member,
  canActivate,
  canDeactivate,
  canRemove,
  isPending,
  pendingKey,
  onRoleChange,
  onRequestDeactivate,
  onRequestRemove,
  onActivate,
}: {
  member: StaffMemberRow
  canActivate: boolean
  canDeactivate: boolean
  canRemove: boolean
  isPending: boolean
  pendingKey: string | null
  onRoleChange: StaffTeamTableProps['onRoleChange']
  onRequestDeactivate: StaffTeamTableProps['onRequestDeactivate']
  onRequestRemove: StaffTeamTableProps['onRequestRemove']
  onActivate: StaffTeamTableProps['onActivate']
}) {
  const editable = canEditMember(member, canActivate, canDeactivate)
  const removable = canRemoveMember(member, canRemove)

  return (
    <div className={cn('px-4 py-4', !member.isActive && 'opacity-75')}>
      <div className="flex items-start gap-3">
        <MemberAvatar name={member.fullName} inactive={!member.isActive} />
        <div className="min-w-0 flex-1">
          <MemberIdentity member={member} compact />
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge className={ROLE_COLORS[member.roleCode]}>
              {ROLE_LABELS[member.roleCode]}
            </Badge>
            <Badge variant={member.isActive ? 'success' : 'secondary'}>
              {member.isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Inscrit le {formatDate(member.createdAt)}
          </p>
        </div>
      </div>

      {(editable || removable) && (
        <div className="mt-3">
          <MemberActions
            member={member}
            canActivate={canActivate}
            canDeactivate={canDeactivate}
            canRemove={canRemove}
            isPending={isPending}
            pendingKey={pendingKey}
            onRoleChange={onRoleChange}
            onRequestDeactivate={onRequestDeactivate}
            onRequestRemove={onRequestRemove}
            onActivate={onActivate}
            layout="mobile"
          />
        </div>
      )}
    </div>
  )
}
