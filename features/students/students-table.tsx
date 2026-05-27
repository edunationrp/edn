'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DataTableShell,
  FilterBar,
  FilterSearch,
  FilterSelect,
} from '@/components/dashboard/filter-bar'
import { getStatusColor, getStatusLabel, formatDate, getInitials } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'
import type { Tables } from '@/types/database.types'

type StudentWithEnrollment = Tables<'students'> & {
  student_enrollments?: Array<{
    class_id: string
    classes?: { name: string } | null
  }>
}

type ClassOption = { id: string; name: string }

type StudentsFilters = {
  q: string
  class: string
  gender: string
  status: string
}

interface StudentsTableProps {
  students: StudentWithEnrollment[]
  page?: number
  totalPages?: number
  totalCount?: number
  classes: ClassOption[]
  filters: StudentsFilters
}

function buildStudentsUrl(filters: StudentsFilters, page = 1) {
  const sp = new URLSearchParams()
  if (page > 1) sp.set('page', String(page))
  if (filters.q.trim()) sp.set('q', filters.q.trim())
  if (filters.class !== 'all') sp.set('class', filters.class)
  if (filters.gender !== 'all') sp.set('gender', filters.gender)
  if (filters.status !== 'all') sp.set('status', filters.status)
  const qs = sp.toString()
  return `/dashboard/students${qs ? `?${qs}` : ''}`
}

export function StudentsTable({
  students,
  page = 1,
  totalPages = 1,
  totalCount,
  classes,
  filters,
}: StudentsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState(filters.q)

  useEffect(() => {
    setSearch(filters.q)
  }, [filters.q])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search === filters.q) return
      router.push(buildStudentsUrl({ ...filters, q: search }, 1))
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, filters, router])

  function updateFilter(key: keyof StudentsFilters, value: string) {
    router.push(buildStudentsUrl({ ...filters, [key]: value }, 1))
  }

  return (
    <DataTableShell>
      <FilterBar>
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par numéro IUN, nom…"
          icon={<Search className="h-4 w-4" />}
        />
        <FilterSelect
          value={filters.class}
          onChange={v => updateFilter('class', v)}
          className="w-full sm:w-44"
        >
          <option value="all">Toutes les classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={filters.gender}
          onChange={v => updateFilter('gender', v)}
          className="w-full sm:w-36"
        >
          <option value="all">Tous les sexes</option>
          <option value="M">Garçons</option>
          <option value="F">Filles</option>
        </FilterSelect>
        <FilterSelect
          value={filters.status}
          onChange={v => updateFilter('status', v)}
          className="w-full sm:w-40"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="rejected">Rejeté</option>
          <option value="transferred">Transféré</option>
          <option value="inactive">Inactif</option>
        </FilterSelect>
      </FilterBar>

      <div className="divide-y divide-slate-100 sm:hidden">
        {students.length > 0 ? (
          students.map(student => {
            const enrollment = student.student_enrollments?.[0]
            const className = enrollment?.classes?.name ?? '—'
            return (
              <Link
                key={student.id}
                href={`/dashboard/students/${student.id}`}
                className="flex items-start gap-3.5 p-4 transition hover:bg-slate-50/80"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
                  {getInitials(`${student.first_name} ${student.last_name}`)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {student.last_name} {student.first_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {className} · {student.iun}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className={getStatusColor(student.status)}>
                      {getStatusLabel(student.status)}
                    </Badge>
                    <Badge variant={student.gender === 'M' ? 'info' : 'secondary'}>
                      {student.gender === 'M' ? 'Garçon' : 'Fille'}
                    </Badge>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="py-14 text-center text-slate-500">
            <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">Aucun élève trouvé</p>
            <p className="mt-1 text-xs">Modifiez la recherche ou les filtres.</p>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className={dashboard.tableHead}>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Élève
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                IUN
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Classe
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Genre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Inscription
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map(student => {
                const enrollment = student.student_enrollments?.[0]
                const className = enrollment?.classes?.name ?? '—'

                return (
                  <tr key={student.id} className={dashboard.tableRow}>
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/students/${student.id}`} className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
                          {getInitials(`${student.first_name} ${student.last_name}`)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-[#1B3A6B]">
                            {student.last_name} {student.first_name}
                          </p>
                          {student.phone && (
                            <p className="text-xs text-slate-500">{student.phone}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {student.iun}
                      </code>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{className}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={student.gender === 'M' ? 'info' : 'secondary'}>
                        {student.gender === 'M' ? 'Garçon' : 'Fille'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={getStatusColor(student.status)}>
                        {getStatusLabel(student.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(student.created_at)}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-500">
                  <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm font-medium">Aucun élève trouvé</p>
                  <p className="mt-1 text-xs">Modifiez la recherche ou les filtres.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(students.length > 0 || page > 1) && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3.5">
          <p className="text-sm text-slate-500">
            Page {page} / {totalPages}
            {totalCount !== undefined ? ` · ${totalCount} élève${totalCount > 1 ? 's' : ''}` : ''}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? (
                <Link href={buildStudentsUrl(filters, page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon-sm" className="bg-[#1B3A6B] text-white hover:bg-[#152F58]">
              {page}
            </Button>
            <Button variant="outline" size="icon-sm" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? (
                <Link href={buildStudentsUrl(filters, page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </DataTableShell>
  )
}
