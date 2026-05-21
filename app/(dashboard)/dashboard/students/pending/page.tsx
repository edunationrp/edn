import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves en attente de validation</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {count ?? 0} inscription{(count ?? 0) > 1 ? 's' : ''} à traiter
          </p>
        </div>
      </div>

      {(count ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserCheck className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="font-semibold text-lg">Tout est à jour !</h3>
            <p className="text-muted-foreground text-sm mt-1">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{student.last_name} {student.first_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{student.iun}</code>
                          <span className="text-xs text-muted-foreground">
                            Né(e) le {formatDate(student.birth_date)} à {student.birth_place ?? '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        {isUrgent ? (
                          <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={isUrgent ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                          {daysPending === 0 ? "Aujourd'hui" : `Il y a ${daysPending} jour${daysPending > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                          Rejeter
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <UserCheck className="h-4 w-4" />
                          Valider
                        </Button>
                      </div>
                    </div>
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
