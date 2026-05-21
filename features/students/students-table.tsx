'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getStatusColor, getStatusLabel, formatDate, getInitials } from '@/lib/utils'
import type { Tables } from '@/types/database.types'

type StudentWithEnrollment = Tables<'students'> & {
  student_enrollments?: Array<{
    class_id: string
    classes?: { name: string } | null
  }>
}

interface StudentsTableProps {
  students: StudentWithEnrollment[]
}

export function StudentsTable({ students }: StudentsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = students.filter(s => {
    const matchSearch = search === '' ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.iun.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)

    const matchStatus = statusFilter === 'all' || s.status === statusFilter

    return matchSearch && matchStatus
  })

  return (
    <Card className="overflow-hidden">
      {/* Barre de recherche et filtres */}
      <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, IUN, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="rejected">Rejeté</option>
          <option value="transferred">Transféré</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">IUN</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Classe</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Genre</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date d'inscription</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map(student => {
                const enrollment = student.student_enrollments?.[0]
                const className = enrollment?.classes?.name ?? '—'

                return (
                  <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(`${student.first_name} ${student.last_name}`)}
                        </div>
                        <div>
                          <p className="font-medium">{student.last_name} {student.first_name}</p>
                          {student.phone && (
                            <p className="text-xs text-muted-foreground">{student.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{student.iun}</code>
                    </td>
                    <td className="py-3 px-4">{className}</td>
                    <td className="py-3 px-4">
                      <Badge variant={student.gender === 'M' ? 'info' : 'secondary'}>
                        {student.gender === 'M' ? 'Garçon' : 'Fille'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(student.status)}>
                        {getStatusLabel(student.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/students/${student.id}`}>Voir</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Aucun élève trouvé</p>
                    {search && (
                      <p className="text-xs mt-1">
                        Essayez avec d&apos;autres critères de recherche
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" className="bg-primary text-white">
              1
            </Button>
            <Button variant="outline" size="icon-sm" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
