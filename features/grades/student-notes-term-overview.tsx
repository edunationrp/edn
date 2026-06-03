import { cn } from '@/lib/utils'
import type { PublishedSubjectGrades } from '@/lib/grades/published-notes'
import { SLOT_LABELS } from '@/lib/grades/published-notes'
import { formatGradeValue, getGradeLevel, GRADE_LEVEL_STYLES } from '@/lib/grades/grade-target'
import type { GradeSequenceSlot } from '@/lib/grades/sheet-types'

const SLOTS: GradeSequenceSlot[] = ['devoir1', 'devoir2', 'examen']

function GradeCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-slate-300">—</span>
  }
  const level = getGradeLevel(value)
  const styles = GRADE_LEVEL_STYLES[level]
  return (
    <span className={cn('font-bold tabular-nums', styles.text)}>
      {formatGradeValue(value)}
    </span>
  )
}

type Props = {
  subjects: PublishedSubjectGrades[]
}

export function StudentNotesTermOverview({ subjects }: Props) {
  if (subjects.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-3 py-2.5 sm:px-4">Matière</th>
              {SLOTS.map(slot => (
                <th key={slot} className="px-2 py-2.5 text-center">
                  {SLOT_LABELS[slot]}
                </th>
              ))}
              <th className="px-2 py-2.5 text-center">Moyenne</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">Appréciation</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(subject => {
              const avgLevel =
                subject.average !== null ? getGradeLevel(subject.average) : null
              const avgStyles = avgLevel ? GRADE_LEVEL_STYLES[avgLevel] : null

              return (
                <tr
                  key={subject.subjectId}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-3 py-3 font-semibold text-gray-900 sm:px-4">
                    {subject.subjectName}
                  </td>
                  {SLOTS.map(slot => (
                    <td key={slot} className="px-2 py-3 text-center">
                      <GradeCell value={subject[slot]} />
                    </td>
                  ))}
                  <td className="px-2 py-3 text-center">
                    {subject.average !== null && avgStyles ? (
                      <span
                        className={cn(
                          'inline-flex min-w-[2.5rem] justify-center rounded-lg px-2 py-0.5 font-bold tabular-nums',
                          avgStyles.bg,
                          avgStyles.text,
                        )}
                      >
                        {subject.average.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-600 sm:table-cell">
                    {subject.appreciation !== '—' ? subject.appreciation : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] text-slate-500 sm:px-4">
        Toutes les notes publiées par l&apos;établissement pour ce trimestre.
      </p>
    </div>
  )
}
