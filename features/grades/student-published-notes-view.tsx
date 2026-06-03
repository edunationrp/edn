import { BookOpen } from 'lucide-react'
import type { PublishedTermGrades } from '@/lib/grades/published-notes'
import type { ClassAverageHintMap } from '@/lib/grades/class-average-hints'
import { getClassAverageHint } from '@/lib/grades/class-average-hints'
import { StudentNotesSubjectCard } from '@/features/grades/student-notes-subject-card'
import { StudentNotesTermOverview } from '@/features/grades/student-notes-term-overview'
import { StudentNotesPdfExport } from '@/features/grades/student-notes-pdf-export'
import { StudentNotesHashScroll } from '@/features/grades/student-notes-hash-scroll'

type Props = {
  terms: PublishedTermGrades[]
  emptyMessage?: string
  enableGoalPlanner?: boolean
  classAverageHints?: ClassAverageHintMap
  studentName?: string
  schoolName?: string
  className?: string | null
}

export function StudentPublishedNotesView({
  terms,
  emptyMessage = 'Aucune note publiée pour le moment. Les notes apparaîtront ici dès leur publication par l\'établissement.',
  enableGoalPlanner = false,
  classAverageHints = {},
  studentName = 'Élève',
  schoolName = 'Établissement',
  className = null,
}: Props) {
  if (terms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <StudentNotesHashScroll />
      {terms.map(termBlock => (
        <section
          key={termBlock.term}
          id={`notes-term-${termBlock.term}`}
          className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="space-y-1">
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1B3A6B] sm:text-lg">
              {termBlock.termLabel}
            </h2>
            <p className="text-sm text-slate-700">
              {termBlock.subjects.length} matière{termBlock.subjects.length > 1 ? 's' : ''} · consulte
              toutes tes notes ci-dessous avant d&apos;exporter.
            </p>
          </div>

          <StudentNotesTermOverview subjects={termBlock.subjects} />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Détail par matière
            </h3>
            <div className="space-y-4">
              {termBlock.subjects.map(subject => (
                <StudentNotesSubjectCard
                  key={`${termBlock.term}-${subject.subjectId}`}
                  term={termBlock.term}
                  subject={subject}
                  enableGoalPlanner={enableGoalPlanner}
                  classAverage={getClassAverageHint(
                    classAverageHints,
                    termBlock.term,
                    subject.subjectId,
                  )}
                />
              ))}
            </div>
          </div>

          {enableGoalPlanner && (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Le PDF reprend les mêmes notes que le tableau ci-dessus.
              </p>
              <StudentNotesPdfExport
                term={termBlock}
                studentName={studentName}
                schoolName={schoolName}
                className={className}
              />
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
