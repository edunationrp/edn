'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePromotionSettings } from '@/lib/actions/promotions'
import { PROMOTION_AVERAGE_RULE_LABELS, type PromotionAverageRule } from '@/lib/promotions/types'
import { notify } from '@/lib/feedback/toast'
import { Loader2 } from 'lucide-react'

export function PromotionSettingsCard({
  passingAverage,
  averageRule,
  readOnly,
}: {
  passingAverage: number
  averageRule: PromotionAverageRule
  readOnly?: boolean
}) {
  const [average, setAverage] = useState(String(passingAverage))
  const [rule, setRule] = useState<PromotionAverageRule>(averageRule)
  const [isPending, startTransition] = useTransition()

  function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly) return
    const parsed = parseFloat(average.replace(',', '.'))
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 20) {
      notify.error('La moyenne doit être un nombre entre 0 et 20.')
      return
    }
    startTransition(async () => {
      const result = await updatePromotionSettings({
        passingAverage: parsed,
        averageRule: rule,
      })
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Paramètres de passage enregistrés')
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Règles de passage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="passing-average">Moyenne minimale (/20)</Label>
            <Input
              id="passing-average"
              type="number"
              min={0}
              max={20}
              step={0.01}
              value={average}
              onChange={e => setAverage(e.target.value)}
              disabled={readOnly || isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="average-rule">Calcul de la moyenne</Label>
            <select
              id="average-rule"
              value={rule}
              onChange={e => setRule(e.target.value as PromotionAverageRule)}
              disabled={readOnly || isPending}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {(Object.entries(PROMOTION_AVERAGE_RULE_LABELS) as [PromotionAverageRule, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
          {!readOnly && (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          )}
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Simulation uniquement : aucune inscription n&apos;est modifiée tant que le passage n&apos;est pas appliqué (phase suivante).
        </p>
      </CardContent>
    </Card>
  )
}
