import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, UserX } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { AbsenceAlertConfig, AbsenceAlertStudent } from '@/lib/attendance/absence-alerts'

type AbsenceAlertsPanelProps = {
  config: AbsenceAlertConfig
  students: AbsenceAlertStudent[]
  compact?: boolean
}

export function AbsenceAlertsPanel({ config, students, compact }: AbsenceAlertsPanelProps) {
  return (
    <Card className={students.length > 0 ? 'border-amber-200 bg-amber-50/40' : undefined}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Alertes vie scolaire
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Seuil : {config.threshold} abs. non justifiées / {config.windowDays} j
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Élèves ayant dépassé le seuil d&apos;absences non justifiées — action recommandée.
        </p>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-white/80 px-4 py-6 text-sm text-muted-foreground">
            <UserX className="h-4 w-4 shrink-0" />
            Aucun élève au-dessus du seuil pour la période en cours.
          </div>
        ) : (
          <div className="space-y-2">
            {students.slice(0, compact ? 5 : 50).map(student => (
              <div
                key={student.studentId}
                className="flex flex-col gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{student.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {[student.className, student.iun].filter(Boolean).join(' · ')}
                  </p>
                  {student.lastAbsenceAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Dernière absence : {formatDate(student.lastAbsenceAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">
                    {student.unjustifiedAbsences} non justifiée(s)
                  </Badge>
                  {student.pendingJustifications > 0 && (
                    <Badge className="bg-amber-100 text-amber-800">
                      {student.pendingJustifications} en attente
                    </Badge>
                  )}
                  {student.justifiedAbsences > 0 && (
                    <Badge variant="secondary">{student.justifiedAbsences} justifiée(s)</Badge>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/students/${student.studentId}`}>Dossier</Link>
                  </Button>
                </div>
              </div>
            ))}
            {compact && students.length > 5 && (
              <Button variant="link" size="sm" className="px-0" asChild>
                <Link href="/dashboard/attendance/alerts">
                  Voir les {students.length} alertes
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
