'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/feedback/toast'
import { publishReportCard, type ReportCardQueueItem } from '@/lib/actions/report-cards'

export function ReportCardPublicationPanel({
  items,
}: {
  items: ReportCardQueueItem[]
}) {
  const [pending, startTransition] = useTransition()

  if (items.length === 0) return null

  function handlePublish(id: string) {
    startTransition(async () => {
      const result = await publishReportCard(id)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Bulletin publié — PDF disponible pour l\'élève et les parents.')
      window.location.reload()
    })
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-emerald-900">
          Bulletins validés — à publier ({items.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Le proviseur a validé ces bulletins. Publiez-les pour les rendre disponibles en PDF
          aux élèves et aux parents.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="font-medium text-gray-900">{item.studentName}</p>
              <p className="text-sm text-muted-foreground">
                {item.term}
                {item.average !== null && ` · Moy. ${item.average.toFixed(2)}/20`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Validé</Badge>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/report-cards/${item.id}`}>Prévisualiser PDF</Link>
              </Button>
              <Button
                size="sm"
                disabled={pending}
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => handlePublish(item.id)}
              >
                {pending ? (
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
