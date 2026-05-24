'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, GraduationCap, Search, Settings, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  FilterBar,
  FilterSearch,
  formatListFooter,
  filterBySearch,
} from '@/components/dashboard/data-table'

export type ClassListRow = {
  id: string
  name: string
  capacity: number | null
}

export type SubjectListRow = {
  id: string
  name: string
  coefficient: number
  is_active: boolean
}

export type LevelListRow = {
  id: string
  name: string
  order_num: number | null
}

const CLASS_COLUMNS = [
  { id: 'name', label: 'Classe' },
  { id: 'capacity', label: 'Capacité', align: 'center' as const },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

const SUBJECT_COLUMNS = [
  { id: 'name', label: 'Matière' },
  { id: 'coef', label: 'Coefficient', align: 'center' as const },
  { id: 'status', label: 'Statut', align: 'center' as const },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

const LEVEL_COLUMNS = [
  { id: 'order', label: '#', align: 'center' as const },
  { id: 'name', label: 'Niveau' },
]

export function ClassesListTable({ classes }: { classes: ClassListRow[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(classes, search, c => c.name),
    [classes, search],
  )

  return (
    <DashboardDataTable
      title={`Classes (${classes.length})`}
      columns={CLASS_COLUMNS}
      data={filtered}
      keyExtractor={c => c.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher une classe…" icon={<Search className="h-4 w-4" />} />
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/dashboard/classes/new">Ajouter</Link>
          </Button>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, classes.length, !!search)}
      emptyState={{
        icon: <BookOpen className="h-6 w-6" />,
        title: 'Aucune classe',
        action: <Button variant="link" size="sm" asChild><Link href="/dashboard/classes/new">Créer une classe</Link></Button>,
      }}
      renderMobileRow={cls => (
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B3A6B]/10 text-sm font-bold text-[#1B3A6B]">
              {cls.name[0]}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{cls.name}</p>
              <p className="text-xs text-slate-500">Capacité : {cls.capacity ?? '—'}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/dashboard/classes/${cls.id}`}><Users className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/dashboard/classes/${cls.id}/edit`}><Settings className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      )}
      renderDesktopRow={cls => (
        <DashboardTableRow key={cls.id}>
          <DashboardTableCell>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3A6B]/10 text-sm font-bold text-[#1B3A6B]">
                {cls.name[0]}
              </div>
              <span className="font-semibold text-slate-900">{cls.name}</span>
            </div>
          </DashboardTableCell>
          <DashboardTableCell align="center">{cls.capacity ?? '—'}</DashboardTableCell>
          <DashboardTableCell align="center">
            <div className="flex justify-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/classes/${cls.id}`}><Users className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/classes/${cls.id}/edit`}><Settings className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}

export function SubjectsListTable({ subjects }: { subjects: SubjectListRow[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(subjects, search, s => s.name),
    [subjects, search],
  )

  return (
    <DashboardDataTable
      title={`Matières (${subjects.length})`}
      columns={SUBJECT_COLUMNS}
      data={filtered}
      keyExtractor={s => s.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher une matière…" icon={<Search className="h-4 w-4" />} />
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/dashboard/classes/subjects/new">Ajouter</Link>
          </Button>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, subjects.length, !!search)}
      emptyState={{
        icon: <Settings className="h-6 w-6" />,
        title: 'Aucune matière',
        action: <Button variant="link" size="sm" asChild><Link href="/dashboard/classes/subjects/new">Créer une matière</Link></Button>,
      }}
      renderMobileRow={sub => (
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-semibold text-slate-900">{sub.name}</p>
            <p className="text-xs text-slate-500">Coef. {sub.coefficient}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={sub.is_active ? 'success' : 'secondary'}>
              {sub.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/dashboard/classes/subjects/${sub.id}/edit`}><Settings className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      )}
      renderDesktopRow={sub => (
        <DashboardTableRow key={sub.id}>
          <DashboardTableCell className="font-semibold text-slate-900">{sub.name}</DashboardTableCell>
          <DashboardTableCell align="center">{sub.coefficient}</DashboardTableCell>
          <DashboardTableCell align="center">
            <Badge variant={sub.is_active ? 'success' : 'secondary'}>
              {sub.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DashboardTableCell>
          <DashboardTableCell align="center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/classes/subjects/${sub.id}/edit`}><Settings className="h-3.5 w-3.5" /></Link>
            </Button>
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}

export function LevelsListTable({ levels }: { levels: LevelListRow[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(levels, search, l => l.name),
    [levels, search],
  )

  return (
    <DashboardDataTable
      title={`Niveaux scolaires (${levels.length})`}
      columns={LEVEL_COLUMNS}
      data={filtered}
      keyExtractor={l => l.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher un niveau…" icon={<Search className="h-4 w-4" />} />
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/dashboard/classes/levels/new">Ajouter</Link>
          </Button>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, levels.length, !!search)}
      emptyState={{
        icon: <GraduationCap className="h-6 w-6" />,
        title: 'Aucun niveau configuré',
      }}
      renderMobileRow={level => (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {level.order_num ?? '?'}
          </div>
          <span className="font-medium text-slate-900">{level.name}</span>
        </div>
      )}
      renderDesktopRow={level => (
        <DashboardTableRow key={level.id}>
          <DashboardTableCell align="center">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {level.order_num ?? '?'}
            </span>
          </DashboardTableCell>
          <DashboardTableCell className="font-semibold text-slate-900">{level.name}</DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
