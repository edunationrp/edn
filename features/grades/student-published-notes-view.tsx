import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PublishedTermGrades } from '@/lib/grades/published-notes'
import { SLOT_LABELS } from '@/lib/grades/published-notes'

type Props = {
  terms: PublishedTermGrades[]
  emptyMessage?: string
}

function formatGrade(value: number | null) {
  if (value === null) return '—'
  return `${value.toFixed(2).replace(/\.?0+$/, '')}/20`
}

export function StudentPublishedNotesView({
  terms,
  emptyMessage = 'Aucune note publiée pour le moment. Les notes apparaîtront ici dès leur publication par l\'établissement.',
}: Props) {
  if (terms.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="space-y-4">
      {terms.map(termBlock => (
        <Card key={termBlock.term}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{termBlock.termLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {termBlock.subjects.map(subject => (
              <div
                key={subject.subjectId}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{subject.subjectName}</p>
                  {subject.average !== null && (
                    <Badge variant="secondary" className="font-semibold">
                      Moyenne {subject.average.toFixed(1)}/20
                    </Badge>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {(['devoir1', 'devoir2', 'examen'] as const).map(slot => {
                    const value = subject[slot]
                    if (value === null) return null
                    return (
                      <div
                        key={slot}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                      >
                        <span className="text-gray-600">{SLOT_LABELS[slot]}</span>
                        <span className="font-semibold text-[#1B3A6B]">{formatGrade(value)}</span>
                      </div>
                    )
                  })}
                </div>

                {subject.appreciation !== '—' && (
                  <p className="mt-3 text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Appréciation : </span>
                    {subject.appreciation}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
