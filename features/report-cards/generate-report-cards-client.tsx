'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Loader2 } from 'lucide-react'
import { generateReportCardsForClass } from '@/lib/actions/grades'
import { notify } from '@/lib/feedback/toast'

type ClassOption = { id: string; name: string; studentCount: number }
type TermOption = { id: string; name: string }

export function GenerateReportCardsClient({
  schoolId,
  schoolYearId,
  userId,
  classes,
  terms,
  initialClassId = '',
}: {
  schoolId: string
  schoolYearId: string
  userId: string
  classes: ClassOption[]
  terms: TermOption[]
  initialClassId?: string
}) {
  const router = useRouter()
  const [classId, setClassId] = useState(initialClassId || classes[0]?.id || '')
  const [termId, setTermId] = useState(terms[0]?.id || '')
  const [isPending, startTransition] = useTransition()

  const selectedClass = classes.find(c => c.id === classId)

  function handleGenerate() {
    if (!classId || !termId) return
    startTransition(async () => {
      const result = await generateReportCardsForClass({
        schoolId,
        schoolYearId,
        termId,
        classId,
        userId,
      })
      if (result.error) {
        notify.error(result.error, 'report_cards')
        return
      }
      notify.success(`${result.created ?? 0} bulletin(s) préparé(s)`)
      router.push('/dashboard/report-cards')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Générer les bulletins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Classe</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sélectionner</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Période</label>
            <select
              value={termId}
              onChange={e => setTermId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sélectionner</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && (
          <Badge variant="secondary" className="text-xs">
            {selectedClass.studentCount} élève(s) inscrit(s)
          </Badge>
        )}

        <Button
          className="w-full sm:w-auto"
          disabled={isPending || !classId || !termId || classes.length === 0 || terms.length === 0}
          onClick={handleGenerate}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération…
            </>
          ) : (
            'Préparer les bulletins'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
