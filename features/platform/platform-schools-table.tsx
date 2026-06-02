'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Building2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { SCHOOL_TYPES } from '@/lib/onboarding/constants'
import type { PlatformSchoolRow } from '@/lib/platform/types'
import { PlatformSchoolStatusActions } from '@/features/platform/platform-school-status-actions'

const COLUMNS = [
  { id: 'school', label: 'Établissement' },
  { id: 'type', label: 'Type' },
  { id: 'location', label: 'Localisation' },
  { id: 'stats', label: 'Effectifs' },
  { id: 'status', label: 'Statut' },
  { id: 'actions', label: '' },
]

export function PlatformSchoolsTable({ schools }: { schools: PlatformSchoolRow[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(schools, search, s =>
      [s.name, s.city, s.country, s.organizationName].filter(Boolean).join(' ')
    )
    if (typeFilter !== 'all') rows = rows.filter(s => s.type === typeFilter)
    if (statusFilter === 'active') rows = rows.filter(s => s.isActive)
    if (statusFilter === 'inactive') rows = rows.filter(s => !s.isActive)
    return rows
  }, [schools, search, typeFilter, statusFilter])

  const hasFilters = !!search || typeFilter !== 'all' || statusFilter !== 'all'

  function statusBadge(status: PlatformSchoolRow['platformStatus']) {
    if (status === 'DISABLED') return { variant: 'destructive' as const, label: 'Désactivé' }
    if (status === 'SUSPENDED') return { variant: 'warning' as const, label: 'Suspendu' }
    return { variant: 'success' as const, label: 'Actif' }
  }

  function renderSchool(school: PlatformSchoolRow, mobile: boolean) {
    const typeLabel = SCHOOL_TYPES.find(t => t.value === school.type)?.label ?? school.type
    const status = statusBadge(school.platformStatus)
    if (mobile) {
      return (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/dashboard/platform/schools/${school.id}`} className="font-semibold text-[#1B3A6B]">
              {school.name}
            </Link>
            <Badge variant={status.variant}>
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {typeLabel} · {[school.city, school.country].filter(Boolean).join(', ') || '—'}
          </p>
          <p className="mt-1 text-xs tabular-nums text-slate-500">
            {school.studentCount} élève(s) · {school.staffCount} accès
          </p>
          <div className="mt-3 flex items-center gap-2">
            <PlatformSchoolStatusActions
              schoolId={school.id}
              currentStatus={school.platformStatus}
            />
            <span className="text-xs text-muted-foreground">Actions de statut</span>
          </div>
        </div>
      )
    }
    return (
      <DashboardTableRow>
        <DashboardTableCell>
          <Link href={`/dashboard/platform/schools/${school.id}`} className="font-semibold text-[#1B3A6B] hover:underline">
            {school.name}
          </Link>
          {school.organizationName && (
            <p className="text-xs text-muted-foreground">{school.organizationName}</p>
          )}
        </DashboardTableCell>
        <DashboardTableCell>
          <Badge variant="secondary">{typeLabel}</Badge>
        </DashboardTableCell>
        <DashboardTableCell>
          <span className="text-sm text-slate-600">
            {[school.city, school.country].filter(Boolean).join(', ') || '—'}
          </span>
        </DashboardTableCell>
        <DashboardTableCell>
          <span className="text-sm tabular-nums">
            {school.studentCount} élève(s) · {school.staffCount} accès
          </span>
        </DashboardTableCell>
        <DashboardTableCell>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>
              {status.label}
            </Badge>
            {school.suspendedUntil && (
              <span className="text-[11px] text-muted-foreground">
                jusqu&apos;au {new Date(school.suspendedUntil).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </DashboardTableCell>
        <DashboardTableCell>
          <div className="flex items-center justify-end gap-1">
            <PlatformSchoolStatusActions
              schoolId={school.id}
              currentStatus={school.platformStatus}
            />
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/platform/schools/${school.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </DashboardTableCell>
      </DashboardTableRow>
    )
  }

  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={filtered}
      keyExtractor={s => s.id}
      minWidth="960px"
      toolbar={
        <FilterBar>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher établissement, ville…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} className="w-full sm:w-44">
            <option value="all">Tous les types</option>
            {SCHOOL_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-40">
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, schools.length, hasFilters)}
      emptyState={{
        icon: <Building2 className="h-6 w-6" />,
        title: hasFilters ? 'Aucun résultat' : 'Aucun établissement',
        description: hasFilters ? 'Modifiez la recherche ou les filtres.' : 'Les établissements inscrits apparaîtront ici.',
      }}
      renderMobileRow={s => renderSchool(s, true)}
      renderDesktopRow={s => renderSchool(s, false)}
    />
  )
}
