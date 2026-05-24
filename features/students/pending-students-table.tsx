'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Clock, Search, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  FilterBar,
  FilterSearch,
  formatListFooter,
  filterBySearch,
} from '@/components/dashboard/data-table'
import { PendingStudentActions } from '@/features/students/pending-student-actions'
import { cn, formatDate, getInitials } from '@/lib/utils'

export type PendingStudentRow = {
  id: string
  iun: string
  first_name: string
  last_name: string
  birth_date: string
  birth_place: string | null
  created_at: string
}

const COLUMNS = [
  { id: 'student', label: 'Élève' },
  { id: 'iun', label: 'IUN' },
  { id: 'birth', label: 'Naissance' },
  { id: 'pending', label: 'En attente' },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

function daysPending(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function PendingStudentsTable({ students }: { students: PendingStudentRow[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => filterBySearch(students, search, s =>
      [s.first_name, s.last_name, s.iun, s.birth_place].filter(Boolean).join(' ')
    ),
    [students, search],
  )

  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={filtered}
      keyExtractor={s => s.id}
      minWidth="800px"
      toolbar={
        <FilterBar className="border-slate-100 bg-white">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher nom, IUN…"
            icon={<Search className="h-4 w-4" />}
          />
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, students.length, !!search)}
      emptyState={{
        icon: <UserCheck className="h-6 w-6" />,
        title: search ? 'Aucun élève trouvé' : 'Tout est à jour !',
        description: search ? 'Modifiez la recherche.' : 'Aucune inscription en attente de validation.',
      }}
      renderMobileRow={student => {
        const days = daysPending(student.created_at)
        const urgent = days >= 2
        return (
          <div className={cn('px-4 py-4', urgent && 'border-l-4 border-l-orange-400')}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
                {getInitials(`${student.first_name} ${student.last_name}`)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {student.last_name} {student.first_name}
                </p>
                <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                  {student.iun}
                </code>
                <p className="mt-1 text-xs text-slate-500">
                  Né(e) le {formatDate(student.birth_date)}
                  {student.birth_place ? ` à ${student.birth_place}` : ''}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {urgent ? (
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className={urgent ? 'font-medium text-orange-600' : 'text-slate-500'}>
                    {days === 0 ? "Aujourd'hui" : `Il y a ${days} jour${days > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="mt-3">
                  <PendingStudentActions studentId={student.id} />
                </div>
              </div>
            </div>
          </div>
        )
      }}
      renderDesktopRow={student => {
        const days = daysPending(student.created_at)
        const urgent = days >= 2
        return (
          <DashboardTableRow key={student.id} className={urgent ? 'bg-orange-50/30' : undefined}>
            <DashboardTableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
                  {getInitials(`${student.first_name} ${student.last_name}`)}
                </div>
                <span className="font-semibold text-slate-900">
                  {student.last_name} {student.first_name}
                </span>
              </div>
            </DashboardTableCell>
            <DashboardTableCell>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">{student.iun}</code>
            </DashboardTableCell>
            <DashboardTableCell className="text-sm text-slate-600">
              {formatDate(student.birth_date)}
              {student.birth_place ? ` · ${student.birth_place}` : ''}
            </DashboardTableCell>
            <DashboardTableCell>
              <Badge variant={urgent ? 'warning' : 'secondary'}>
                {days === 0 ? "Aujourd'hui" : `${days}j`}
              </Badge>
            </DashboardTableCell>
            <DashboardTableCell align="center">
              <PendingStudentActions studentId={student.id} />
            </DashboardTableCell>
          </DashboardTableRow>
        )
      }}
    />
  )
}
