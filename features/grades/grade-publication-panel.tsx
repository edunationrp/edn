'use client'

import { useState, useTransition } from 'react'
import { Loader2, Megaphone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/feedback/toast'
import { publishGradeSlotToFamilies } from '@/lib/actions/grade-publication'
import { SLOT_LABELS, type GradeSequenceSlot } from '@/lib/grades/sheet-types'

export type PendingGradePublication = {
  id: string
  classId: string
  subjectId: string
  term: string
  slot: GradeSequenceSlot
  submittedAt: string | null
  teacherNote: string | null
  className: string
  subjectName: string
}

const TERM_LABELS: Record<string, string> = {
  T1: 'Trimestre 1',
  T2: 'Trimestre 2',
  T3: 'Trimestre 3',
}

export function GradePublicationPanel({
  publications,
}: {
  publications: PendingGradePublication[]
}) {
  const [pending, startTransition] = useTransition()
  const [publishingId, setPublishingId] = useState<string | null>(null)

  if (publications.length === 0) return null

  async function handlePublish(item: PendingGradePublication) {
    setPublishingId(item.id)
    startTransition(async () => {
      const result = await publishGradeSlotToFamilies({
        classId: item.classId,
        subjectId: item.subjectId,
        term: item.term as 'T1' | 'T2' | 'T3',
        slot: item.slot,
      })
      setPublishingId(null)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success(`${SLOT_LABELS[item.slot]} publié aux familles`)
      window.location.reload()
    })
  }

  return (
    <Card className="border-[#1B3A6B]/20 bg-[#EEF3FA]/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-[#1B3A6B]">
          <Send className="h-4 w-4" />
          Notes en attente de publication
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Le professeur a transmis ces devoirs. Publiez-les pour les rendre visibles aux parents et aux élèves.
          Lorsque toutes les notes du trimestre sont saisies, vous pouvez générer les bulletins.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {publications.map(item => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white bg-white px-4 py-3 shadow-sm"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-gray-900">
                {item.className} · {item.subjectName}
              </p>
              <p className="text-sm text-muted-foreground">
                {TERM_LABELS[item.term] ?? item.term} · {SLOT_LABELS[item.slot]}
              </p>
              {item.teacherNote && (
                <p className="text-xs text-gray-600">Message prof : {item.teacherNote}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                En attente
              </Badge>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => handlePublish(item)}
                className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
              >
                {publishingId === item.id ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Megaphone className="mr-1.5 h-4 w-4" />
                )}
                Publier aux familles
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
