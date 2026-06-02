'use client'

import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  FilterBar,
  FilterSearch,
  FilterSelect,
  formatListFooter,
  filterBySearch,
} from '@/components/dashboard/data-table'
import { ROLE_LABELS } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import { formatDate } from '@/lib/utils'
import type { PlatformUserRow } from '@/lib/platform/types'
import { PlatformUserStatusActions } from '@/features/platform/platform-user-status-actions'

const COLUMNS = [
  { id: 'user', label: 'Utilisateur' },
  { id: 'role', label: 'Rôle principal' },
  { id: 'schools', label: 'Établissements' },
  { id: 'status', label: 'Statut' },
  { id: 'actions', label: '' },
]

export function PlatformUsersTable({ users }: { users: PlatformUserRow[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const roleOptions = useMemo(() => {
    const roles = new Set(users.map(u => u.defaultRole).filter(Boolean) as string[])
    return [...roles]
  }, [users])

  const filtered = useMemo(() => {
    let rows = filterBySearch(users, search, u =>
      [u.fullName, u.email, u.defaultRole, ...u.roles].filter(Boolean).join(' ')
    )
    if (roleFilter !== 'all') {
      rows = rows.filter(u => u.defaultRole === roleFilter || u.roles.includes(roleFilter))
    }
    return rows
  }, [users, search, roleFilter])

  const hasFilters = !!search || roleFilter !== 'all'

  function getStatusBadge(user: PlatformUserRow): { label: string; variant: 'success' | 'secondary' | 'warning' } {
    if (user.accountStatus === 'SUSPENDED_TOTAL' || !user.isActive) {
      return { label: 'Suspendu total', variant: 'secondary' }
    }
    if (user.accountStatus === 'SUSPENDED_TEMPORARY') {
      return { label: 'Suspendu temporaire', variant: 'warning' }
    }
    return { label: 'Actif', variant: 'success' }
  }

  function renderUser(user: PlatformUserRow, mobile: boolean) {
    const role = user.defaultRole as UserRole | null
    const roleLabel = role ? (ROLE_LABELS[role] ?? role) : '—'
    const status = getStatusBadge(user)
    if (mobile) {
      return (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{user.fullName ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{user.email ?? '—'}</p>
            </div>
            <Badge variant={status.variant}>
              {status.label}
            </Badge>
          </div>
          <p className="mt-2 text-xs">{roleLabel} · {user.schoolCount} établ.</p>
          <div className="mt-3 flex items-center gap-2">
            <PlatformUserStatusActions
              userId={user.id}
              isActive={user.isActive}
              accountStatus={user.accountStatus}
            />
          </div>
        </div>
      )
    }
    return (
      <DashboardTableRow>
        <DashboardTableCell>
          <p className="font-semibold text-slate-900">{user.fullName ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{user.email ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground/80">Inscrit le {formatDate(user.createdAt)}</p>
        </DashboardTableCell>
        <DashboardTableCell>
          <Badge variant="secondary">{roleLabel}</Badge>
        </DashboardTableCell>
        <DashboardTableCell>
          <span className="font-semibold tabular-nums text-[#1B3A6B]">{user.schoolCount}</span>
        </DashboardTableCell>
        <DashboardTableCell>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>
              {status.label}
            </Badge>
            {user.suspendedUntil && (
              <span className="text-[11px] text-muted-foreground">
                jusqu&apos;au {formatDate(user.suspendedUntil)}
              </span>
            )}
          </div>
        </DashboardTableCell>
        <DashboardTableCell>
          <div className="flex justify-end">
            <PlatformUserStatusActions
              userId={user.id}
              isActive={user.isActive}
              accountStatus={user.accountStatus}
            />
          </div>
        </DashboardTableCell>
      </DashboardTableRow>
    )
  }

  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={filtered}
      keyExtractor={u => u.id}
      minWidth="820px"
      toolbar={
        <FilterBar>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher nom, email…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={roleFilter} onChange={setRoleFilter} className="w-full sm:w-48">
            <option value="all">Tous les rôles</option>
            {roleOptions.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r as UserRole] ?? r}</option>
            ))}
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, users.length, hasFilters)}
      emptyState={{
        icon: <Users className="h-6 w-6" />,
        title: hasFilters ? 'Aucun résultat' : 'Aucun utilisateur',
        description: hasFilters ? 'Modifiez la recherche.' : 'Les comptes inscrits apparaîtront ici.',
      }}
      renderMobileRow={u => renderUser(u, true)}
      renderDesktopRow={u => renderUser(u, false)}
    />
  )
}
