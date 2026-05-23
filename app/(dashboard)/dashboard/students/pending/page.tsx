import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/dashboard/page-header'
import { PendingStudentActions } from '@/features/students/pending-student-actions'
import { UserCheck, Clock, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Élèves en attente',
}

export default async function PendingStudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const schoolRole = await getUserSchoolContext(user.id)

  const { data: studentsRaw, count } = await supabase
    .from('students')
    .select('id, iun, first_name, last_name, birth_date, birth_place, created_at', { count: 'exact' })
    .eq('school_id', schoolRole?.school_id ?? '')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const students = studentsRaw as Array<{
    id: string; iun: string; first_name: string; last_name: string;
    birth_date: string; birth_place: string | null; created_at: string;
  }> | null

  const total = count ?? 0

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Élèves en attente de validation"
        description={`${total} inscription${total > 1 ? 's' : ''} à traiter`}
      />

      {total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <UserCheck className="mb-4 h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Tout est à jour !</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucune inscription en attente de validation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {students?.map(student => {
            const daysPending = Math.floor(
              (Date.now() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
            const isUrgent = daysPending >= 2

            return (
              <Card key={student.id} className={isUrgent ? 'border-orange-300' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{student.last_name} {student.first_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{student.iun}</code>
                          <span className="text-xs text-muted-foreground">
                            Né(e) le {formatDate(student.birth_date)}
                            {student.birth_place ? ` à ${student.birth_place}` : ''}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          {isUrgent ? (
                            <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={isUrgent ? 'font-medium text-orange-600' : 'text-muted-foreground'}>
                            {daysPending === 0 ? "Aujourd'hui" : `Il y a ${daysPending} jour${daysPending > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <PendingStudentActions studentId={student.id} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
