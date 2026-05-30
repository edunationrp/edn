import { getRecentSecretaryGradeAlerts } from '@/lib/actions/grade-sheet'
import { formatRelativeDate } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export async function GradeAlertsBanner() {
  const alerts = await getRecentSecretaryGradeAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-900">
        <AlertTriangle className="h-4 w-4" />
        Modifications du secrétariat sur vos notes
      </div>
      <ul className="space-y-2">
        {alerts.map(alert => {
          const student = alert.students
          const subjectName = alert.evaluations?.subjects?.name ?? 'Matière'
          const studentName = student ? `${student.last_name} ${student.first_name}` : 'Élève'
          return (
            <li
              key={alert.id}
              className="rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <span className="font-medium text-slate-900">{studentName}</span>
              {' · '}
              {subjectName} · {alert.evaluations?.title ?? 'Évaluation'} :{' '}
              <span className="font-medium">
                {alert.old_value ?? '—'} → {alert.new_value ?? '—'}
              </span>
              {alert.profiles?.full_name && (
                <span className="text-muted-foreground"> · par {alert.profiles.full_name}</span>
              )}
              {alert.reason && (
                <span className="text-muted-foreground"> · Motif : {alert.reason}</span>
              )}
              <span className="text-muted-foreground"> · {formatRelativeDate(alert.created_at)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
