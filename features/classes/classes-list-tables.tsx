'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, FileCheck, GraduationCap, Search, Settings, UserCheck, Users } from 'lucide-react'
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
import type { TeacherAssignmentRow } from '@/lib/classes/access'

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

const ASSIGNMENT_COLUMNS = [
  { id: 'class', label: 'Classe' },
  { id: 'subject', label: 'Matière' },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

function classColumns(canManage: boolean) {
  const cols = [
    { id: 'name', label: 'Classe' },
    { id: 'capacity', label: 'Capacité', align: 'center' as const },
  ]
  if (canManage) cols.push({ id: 'actions', label: 'Actions', align: 'center' as const })
  return cols
}

function subjectColumns(canManage: boolean) {
  const cols = [
    { id: 'name', label: 'Matière' },
    { id: 'coef', label: 'Coefficient', align: 'center' as const },
    { id: 'status', label: 'Statut', align: 'center' as const },
  ]
  if (canManage) cols.push({ id: 'actions', label: 'Actions', align: 'center' as const })
  return cols
}

export function TeacherAssignmentsTable({ assignments }: { assignments: TeacherAssignmentRow[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(assignments, search, a => `${a.className} ${a.subjectName}`),
    [assignments, search],
  )

  return (
    <DashboardDataTable
      title={`Mes affectations (${assignments.length})`}
      columns={ASSIGNMENT_COLUMNS}
      data={filtered}
      keyExtractor={a => a.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher classe ou matière…"
            icon={<Search className="h-4 w-4" />}
          />
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, assignments.length, !!search)}
      emptyState={{
        icon: <BookOpen className="h-6 w-6" />,
        title: 'Aucune affectation',
        description: 'Contactez la direction pour vous assigner des classes et matières.',
      }}
      renderMobileRow={a => (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{a.className}</p>
              <p className="mt-0.5 text-sm text-slate-500">{a.subjectName}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.classId && (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/classes/${a.classId}`}>
                    <Users className="h-3.5 w-3.5" />
                    Élèves
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/grades/entry?class=${a.classId}${a.subjectId ? `&subject=${a.subjectId}` : ''}`}>
                    <FileCheck className="h-3.5 w-3.5" />
                    Notes
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/attendance/take?class=${a.classId}`}>
                    <UserCheck className="h-3.5 w-3.5" />
                    Appel
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      renderDesktopRow={a => (
        <DashboardTableRow key={a.id}>
          <DashboardTableCell className="font-semibold text-slate-900">{a.className}</DashboardTableCell>
          <DashboardTableCell>{a.subjectName}</DashboardTableCell>
          <DashboardTableCell align="center">
            {a.classId ? (
              <div className="flex flex-wrap justify-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/classes/${a.classId}`} title="Voir les élèves">
                    <Users className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/grades/entry?class=${a.classId}${a.subjectId ? `&subject=${a.subjectId}` : ''}`} title="Saisir les notes">
                    <FileCheck className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/attendance/take?class=${a.classId}`} title="Faire l'appel">
                    <UserCheck className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : '—'}
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}

export function ClassesListTable({
  classes,
  canManage = true,
  readOnlyTitle,
}: {
  classes: ClassListRow[]
  canManage?: boolean
  readOnlyTitle?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(classes, search, c => c.name),
    [classes, search],
  )
  const columns = classColumns(canManage)

  return (
    <DashboardDataTable
      title={readOnlyTitle ?? `Classes (${classes.length})`}
      columns={columns}
      data={filtered}
      keyExtractor={c => c.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher une classe…" icon={<Search className="h-4 w-4" />} />
          {canManage && (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href="/dashboard/classes/new">Ajouter</Link>
            </Button>
          )}
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, classes.length, !!search)}
      emptyState={{
        icon: <BookOpen className="h-6 w-6" />,
        title: canManage ? 'Aucune classe' : 'Aucune classe assignée',
        description: canManage ? undefined : 'Vos classes apparaîtront ici une fois assignées par la direction.',
        action: canManage ? (
          <Button variant="link" size="sm" asChild><Link href="/dashboard/classes/new">Créer une classe</Link></Button>
        ) : undefined,
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
            {canManage && (
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/dashboard/classes/${cls.id}/edit`}><Settings className="h-4 w-4" /></Link>
              </Button>
            )}
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
          {canManage && (
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
          )}
        </DashboardTableRow>
      )}
    />
  )
}

export function SubjectsListTable({
  subjects,
  canManage = true,
  readOnlyTitle,
}: {
  subjects: SubjectListRow[]
  canManage?: boolean
  readOnlyTitle?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(subjects, search, s => s.name),
    [subjects, search],
  )
  const columns = subjectColumns(canManage)

  return (
    <DashboardDataTable
      title={readOnlyTitle ?? `Matières (${subjects.length})`}
      columns={columns}
      data={filtered}
      keyExtractor={s => s.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher une matière…" icon={<Search className="h-4 w-4" />} />
          {canManage && (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href="/dashboard/classes/subjects/new">Ajouter</Link>
            </Button>
          )}
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, subjects.length, !!search)}
      emptyState={{
        icon: <Settings className="h-6 w-6" />,
        title: canManage ? 'Aucune matière' : 'Aucune matière assignée',
        description: canManage ? undefined : 'Vos matières apparaîtront ici une fois assignées par la direction.',
        action: canManage ? (
          <Button variant="link" size="sm" asChild><Link href="/dashboard/classes/subjects/new">Créer une matière</Link></Button>
        ) : undefined,
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
            {canManage && (
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/dashboard/classes/subjects/${sub.id}/edit`}><Settings className="h-4 w-4" /></Link>
              </Button>
            )}
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
          {canManage && (
            <DashboardTableCell align="center">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/classes/subjects/${sub.id}/edit`}><Settings className="h-3.5 w-3.5" /></Link>
              </Button>
            </DashboardTableCell>
          )}
        </DashboardTableRow>
      )}
    />
  )
}

export function LevelsListTable({
  levels,
  canManage = true,
}: {
  levels: LevelListRow[]
  canManage?: boolean
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(levels, search, l => l.name),
    [levels, search],
  )

  return (
    <DashboardDataTable
      title={`Niveaux scolaires (${levels.length})`}
      columns={[
        { id: 'order', label: '#', align: 'center' as const },
        { id: 'name', label: 'Niveau' },
      ]}
      data={filtered}
      keyExtractor={l => l.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher un niveau…" icon={<Search className="h-4 w-4" />} />
          {canManage && (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href="/dashboard/classes/levels/new">Ajouter</Link>
            </Button>
          )}
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
