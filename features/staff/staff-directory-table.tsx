'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Phone, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DataTableShell,
  FilterBar,
  FilterSearch,
  FilterSelect,
} from '@/components/dashboard/filter-bar'
import { removeStaffMemberFromSchool } from '@/lib/actions/staff'
import { notify } from '@/lib/feedback/toast'
import { ROLE_COLORS, ROLE_LABELS, STAFF_ROLES } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

export type StaffDirectoryRow = {
  id: string
  userId: string
  roleCode: UserRole
  isActive: boolean
  createdAt: string
  fullName: string
  email: string | null
  phone: string | null
  isCurrentUser: boolean
}

type StaffDirectoryTableProps = {
  members: StaffDirectoryRow[]
  canRemove: boolean
}

const NON_REMOVABLE_ROLES: UserRole[] = ['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION']

function canRemoveMember(member: StaffDirectoryRow, canRemove: boolean) {
  return canRemove &&
    !member.isCurrentUser &&
    !NON_REMOVABLE_ROLES.includes(member.roleCode)
}

function MemberAvatar({ name, inactive }: { name: string; inactive?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B]/10 text-xs font-bold text-[#1B3A6B] ring-2 ring-white sm:h-9 sm:w-9',
        inactive && 'opacity-60',
      )}
    >
      {getInitials(name)}
    </div>
  )
}

function EmailCell({ email }: { email: string | null }) {
  if (!email) return <span className="text-slate-400">—</span>

  return (
    <a
      href={`mailto:${email}`}
      className="inline-flex max-w-full items-center gap-1.5 truncate text-[#1B3A6B] transition hover:text-[#7AB832] hover:underline"
    >
      <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="truncate">{email}</span>
    </a>
  )
}

function PhoneCell({ phone }: { phone: string | null }) {
  if (!phone) return <span className="text-slate-400">—</span>

  return (
    <a
      href={`tel:${phone.replace(/\s/g, '')}`}
      className="inline-flex items-center gap-1.5 text-slate-600 transition hover:text-[#1B3A6B]"
    >
      <Phone className="h-3.5 w-3.5 shrink-0 opacity-60" />
      <span>{phone}</span>
    </a>
  )
}

function MobileStaffRow({
  member,
  canRemove,
  onRequestRemove,
  isPending,
  pendingKey,
}: {
  member: StaffDirectoryRow
  canRemove: boolean
  onRequestRemove: (memberId: string, memberName: string) => void
  isPending: boolean
  pendingKey: string | null
}) {
  const removable = canRemoveMember(member, canRemove)

  return (
    <article
      className={cn(
        'px-4 py-4 transition-colors active:bg-slate-50/80',
        !member.isActive && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-3">
        <MemberAvatar name={member.fullName} inactive={!member.isActive} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{member.fullName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={ROLE_COLORS[member.roleCode]}>{ROLE_LABELS[member.roleCode]}</Badge>
            <Badge variant={member.isActive ? 'success' : 'secondary'}>
              {member.isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="min-w-0 text-right">
                <EmailCell email={member.email} />
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Tél.</dt>
              <dd className="min-w-0 text-right">
                <PhoneCell phone={member.phone} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Depuis</dt>
              <dd className="text-xs text-slate-500">{formatDate(member.createdAt)}</dd>
            </div>
          </dl>
          {removable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              disabled={isPending || pendingKey === `remove-${member.id}`}
              onClick={() => onRequestRemove(member.id, member.fullName)}
            >
              <Trash2 className="h-4 w-4" />
              Retirer de l&apos;établissement
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function DesktopStaffRow({
  member,
  canRemove,
  onRequestRemove,
  isPending,
  pendingKey,
}: {
  member: StaffDirectoryRow
  canRemove: boolean
  onRequestRemove: (memberId: string, memberName: string) => void
  isPending: boolean
  pendingKey: string | null
}) {
  const removable = canRemoveMember(member, canRemove)

  return (
    <tr className={cn(dashboard.tableRow, !member.isActive && 'opacity-75')}>
      <td className="px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.fullName} inactive={!member.isActive} />
          <span className="font-semibold text-slate-900">{member.fullName}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge className={ROLE_COLORS[member.roleCode]}>{ROLE_LABELS[member.roleCode]}</Badge>
      </td>
      <td className="max-w-[220px] px-4 py-3.5">
        <EmailCell email={member.email} />
      </td>
      <td className="px-4 py-3.5">
        <PhoneCell phone={member.phone} />
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={member.isActive ? 'success' : 'secondary'}>
          {member.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </td>
      <td className="px-4 py-3.5 text-slate-500 sm:px-5">{formatDate(member.createdAt)}</td>
      {canRemove && (
        <td className="px-4 py-3.5 text-right sm:px-5">
          {removable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              title="Retirer de l'établissement"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              disabled={isPending || pendingKey === `remove-${member.id}`}
              onClick={() => onRequestRemove(member.id, member.fullName)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      )}
    </tr>
  )
}

export function StaffDirectoryTable({ members, canRemove }: StaffDirectoryTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return members.filter(member => {
      if (roleFilter !== 'all' && member.roleCode !== roleFilter) return false
      if (statusFilter === 'active' && !member.isActive) return false
      if (statusFilter === 'inactive' && member.isActive) return false

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
  }, [members, search, roleFilter, statusFilter])

  function handleConfirmRemove() {
    if (!removeTarget) return
    setPendingKey(`remove-${removeTarget.id}`)
    startTransition(async () => {
      try {
        const result = await removeStaffMemberFromSchool(removeTarget.id)
        if (result.error) {
          notify.error(result.error)
          return
        }
        notify.success('Membre retiré de l\'établissement')
        setRemoveTarget(null)
        router.refresh()
      } finally {
        setPendingKey(null)
      }
    })
  }

  if (members.length === 0) {
    return (
      <div className={cn(dashboard.card, 'flex flex-col items-center gap-4 px-6 py-16 text-center')}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Users className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Aucun personnel enregistré</p>
          <p className="mt-1 text-sm text-slate-500">
            Invitez votre équipe pédagogique et administrative pour commencer.
          </p>
        </div>
        <Button variant="brandDark" asChild>
          <Link href="/dashboard/staff/roles-permissions?tab=invitations">
            <UserPlus className="h-4 w-4" />
            Inviter du personnel
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <DataTableShell>
      <FilterBar>
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom, email, téléphone…"
          icon={<Search className="h-4 w-4" />}
        />
        <FilterSelect value={roleFilter} onChange={setRoleFilter} className="w-full sm:w-44">
          <option value="all">Tous les rôles</option>
          {STAFF_ROLES.map(role => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-40">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </FilterSelect>
      </FilterBar>

      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900">Équipe pédagogique et administrative</h2>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {filtered.length > 0 ? (
          filtered.map(member => (
            <MobileStaffRow
              key={member.id}
              member={member}
              canRemove={canRemove}
              onRequestRemove={(id, name) => setRemoveTarget({ id, name })}
              isPending={isPending}
              pendingKey={pendingKey}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-slate-500">
            <Search className="h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">Aucun membre trouvé</p>
            <p className="text-xs">Modifiez la recherche ou les filtres.</p>
          </div>
        )}
      </div>

      <div className={cn('hidden md:block', dashboard.tableWrap)}>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className={dashboard.tableHead}>
              <th className={cn(dashboard.label, 'px-4 py-3 text-left sm:px-5')}>Nom</th>
              <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Rôle</th>
              <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Email</th>
              <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Téléphone</th>
              <th className={cn(dashboard.label, 'px-4 py-3 text-left')}>Statut</th>
              <th className={cn(dashboard.label, 'px-4 py-3 text-left sm:px-5')}>Depuis</th>
              {canRemove && (
                <th className={cn(dashboard.label, 'px-4 py-3 text-right sm:px-5')}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map(member => (
                <DesktopStaffRow
                  key={member.id}
                  member={member}
                  canRemove={canRemove}
                  onRequestRemove={(id, name) => setRemoveTarget({ id, name })}
                  isPending={isPending}
                  pendingKey={pendingKey}
                />
              ))
            ) : (
              <tr>
                <td colSpan={canRemove ? 7 : 6} className="py-14 text-center text-slate-500">
                  <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm font-medium">Aucun membre trouvé</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
        {filtered.length} membre{filtered.length !== 1 ? 's' : ''}
        {(search || roleFilter !== 'all' || statusFilter !== 'all') && ' affiché(s)'}
        {' · '}
        {members.length} au total
      </div>
      </DataTableShell>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={open => { if (!open) setRemoveTarget(null) }}
        title="Retirer ce membre ?"
        description={
          removeTarget
            ? `${removeTarget.name} sera définitivement retiré(e) de l'établissement. Son compte EduNation est conservé.`
            : ''
        }
        confirmLabel="Retirer de l'établissement"
        variant="destructive"
        loading={!!pendingKey && !!removeTarget}
        onConfirm={handleConfirmRemove}
      />
    </>
  )
}
