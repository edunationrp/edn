'use client'

import { useMemo, useState, useTransition } from 'react'
import { Search, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
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
import {
  setPlatformOrganizationActive,
  updatePlatformOrganizationPlan,
} from '@/lib/actions/platform'
import { notify } from '@/lib/feedback/toast'
import { formatDate } from '@/lib/utils'
import type { PlatformOrganizationRow } from '@/lib/platform/types'

const COLUMNS = [
  { id: 'org', label: 'Organisation' },
  { id: 'founder', label: 'Fondateur' },
  { id: 'plan', label: 'Plan' },
  { id: 'schools', label: 'Établissements' },
  { id: 'status', label: 'Statut' },
]

export function PlatformOrganizationsTable({ organizations }: { organizations: PlatformOrganizationRow[] }) {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMax, setEditMax] = useState('3')

  const filtered = useMemo(() => {
    let rows = filterBySearch(organizations, search, o =>
      [o.name, o.founderName, o.founderEmail, o.planCode].filter(Boolean).join(' ')
    )
    if (planFilter !== 'all') rows = rows.filter(o => o.planCode === planFilter)
    return rows
  }, [organizations, search, planFilter])

  const hasFilters = !!search || planFilter !== 'all'

  function toggleActive(orgId: string, next: boolean) {
    startTransition(async () => {
      const result = await setPlatformOrganizationActive(orgId, next)
      if ('error' in result && result.error) notify.error(result.error)
      else notify.success(next ? 'Organisation activée' : 'Organisation suspendue')
    })
  }

  function savePlan(orgId: string, planCode: string) {
    const max = parseInt(editMax, 10)
    startTransition(async () => {
      const result = await updatePlatformOrganizationPlan(orgId, planCode, max)
      if ('error' in result && result.error) notify.error(result.error)
      else {
        notify.success('Plan mis à jour')
        setEditingId(null)
      }
    })
  }

  function planCell(org: PlatformOrganizationRow) {
    if (editingId === org.id) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={100}
            value={editMax}
            onChange={e => setEditMax(e.target.value)}
            className="h-8 w-16"
          />
          <Button size="sm" disabled={isPending} onClick={() => savePlan(org.id, org.planCode)}>
            OK
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>×</Button>
        </div>
      )
    }
    return (
      <button
        type="button"
        className="text-left"
        onClick={() => {
          setEditingId(org.id)
          setEditMax(String(org.maxSchools))
        }}
      >
        <Badge className="bg-violet-100 text-violet-800 capitalize">{org.planCode}</Badge>
        <p className="mt-0.5 text-xs text-muted-foreground">max {org.maxSchools} établ.</p>
      </button>
    )
  }

  function renderOrg(org: PlatformOrganizationRow, mobile: boolean) {
    if (mobile) {
      return (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900">{org.name}</p>
            <Badge variant={org.isActive ? 'success' : 'secondary'}>
              {org.isActive ? 'Active' : 'Suspendue'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {org.founderName ?? '—'} · {org.schoolCount}/{org.maxSchools} écoles
          </p>
          <div className="mt-2">{planCell(org)}</div>
        </div>
      )
    }
    return (
      <DashboardTableRow>
        <DashboardTableCell>
          <p className="font-semibold text-slate-900">{org.name}</p>
          <p className="text-xs text-muted-foreground">Créée le {formatDate(org.createdAt)}</p>
        </DashboardTableCell>
        <DashboardTableCell>
          <p className="text-sm">{org.founderName ?? '—'}</p>
          {org.founderEmail && <p className="text-xs text-muted-foreground">{org.founderEmail}</p>}
        </DashboardTableCell>
        <DashboardTableCell>{planCell(org)}</DashboardTableCell>
        <DashboardTableCell>
          <span className="font-semibold tabular-nums text-[#1B3A6B]">{org.schoolCount}</span>
          <span className="text-xs text-muted-foreground"> / {org.maxSchools}</span>
        </DashboardTableCell>
        <DashboardTableCell>
          <div className="flex items-center gap-2">
            <Switch checked={org.isActive} disabled={isPending} onCheckedChange={v => toggleActive(org.id, v)} />
            <Badge variant={org.isActive ? 'success' : 'secondary'}>
              {org.isActive ? 'Active' : 'Suspendue'}
            </Badge>
          </div>
        </DashboardTableCell>
      </DashboardTableRow>
    )
  }

  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={filtered}
      keyExtractor={o => o.id}
      minWidth="900px"
      toolbar={
        <FilterBar>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher organisation…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={planFilter} onChange={setPlanFilter} className="w-full sm:w-40">
            <option value="all">Tous les plans</option>
            <option value="starter">Starter</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, organizations.length, hasFilters)}
      emptyState={{
        icon: <Layers className="h-6 w-6" />,
        title: hasFilters ? 'Aucun résultat' : 'Aucune organisation',
        description: hasFilters ? 'Modifiez la recherche.' : 'Les groupes multi-établissements apparaîtront ici.',
      }}
      renderMobileRow={o => renderOrg(o, true)}
      renderDesktopRow={o => renderOrg(o, false)}
    />
  )
}
