'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { upsertOfficialTuitionRate } from '@/lib/actions/tuition-rates'
import {
  upsertExtraFeeTemplate,
  deactivateExtraFeeTemplate,
} from '@/lib/actions/extra-fees'
import type { TuitionGridRow } from '@/lib/finance/tuition-grid'
import { parseMoneyInput, toMoney } from '@/lib/finance/money'
import { formatCurrency } from '@/lib/utils'
import { notify } from '@/lib/feedback/toast'
import { Lock, Plus, Trash2, GraduationCap } from 'lucide-react'
import Link from 'next/link'

type ExtraTemplate = {
  id: string
  name: string
  suggested_amount: number | null
}

type Props = {
  schoolYearId: string
  schoolYearName: string
  grid: TuitionGridRow[]
  extraTemplates: ExtraTemplate[]
}

export function TuitionConfigPanel({
  schoolYearId,
  schoolYearName,
  grid: initialGrid,
  extraTemplates: initialTemplates,
}: Props) {
  const router = useRouter()
  const [grid, setGrid] = useState(initialGrid)
  const [templates, setTemplates] = useState(initialTemplates)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateAmount, setNewTemplateAmount] = useState('')
  const [isPending, startTransition] = useTransition()

  function saveRate(row: TuitionGridRow, amountStr: string) {
    const amount = parseMoneyInput(amountStr)
    if (amount < 0) {
      notify.error('Montant invalide')
      return
    }
    startTransition(async () => {
      const result = await upsertOfficialTuitionRate({
        schoolYearId,
        classLevelId: row.levelId,
        series: row.series,
        amount,
        rateId: row.rateId ?? undefined,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success(`Tarif enregistré — ${row.label}`)
      router.refresh()
    })
  }

  function addTemplate() {
    const name = newTemplateName.trim()
    if (!name) return
    startTransition(async () => {
      const result = await upsertExtraFeeTemplate({
        name,
        suggestedAmount: newTemplateAmount ? parseMoneyInput(newTemplateAmount) : null,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Frais supplémentaire ajouté')
      setNewTemplateName('')
      setNewTemplateAmount('')
      router.refresh()
    })
  }

  function removeTemplate(id: string) {
    startTransition(async () => {
      const result = await deactivateExtraFeeTemplate(id)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      setTemplates(prev => prev.filter(t => t.id !== id))
      notify.success('Modèle retiré')
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Tarifs officiels de scolarité — {schoolYearName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Seul le proviseur peut définir ces montants. L&apos;intendant les verra en lecture seule
            lors de l&apos;encaissement.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            {grid.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <GraduationCap className="h-10 w-10 text-slate-300" />
                <div>
                  <p className="font-medium text-slate-900">Aucun niveau scolaire configuré</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Les tarifs sont définis par niveau (6ème, 2nde, Tle…). Ajoutez vos niveaux
                    pour commencer à saisir les montants.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/classes/levels/new">Ajouter un niveau scolaire</Link>
                </Button>
              </div>
            ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Classe / Série</th>
                  <th className="px-4 py-3">Montant actuel</th>
                  <th className="px-4 py-3">Nouveau montant (FCFA)</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grid.map(row => (
                  <TuitionRateRow
                    key={`${row.levelId}-${row.series}`}
                    row={row}
                    disabled={isPending}
                    onSave={saveRate}
                  />
                ))}
              </tbody>
            </table>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalogue frais supplémentaires (intendant)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            L&apos;intendant pourra ajouter ces frais au dossier de l&apos;élève (APE, bibliothèque,
            assurance, tenue…). Montant modifiable à l&apos;encaissement.
          </p>
          <ul className="space-y-2">
            {templates.map(t => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border px-4 py-2"
              >
                <span className="font-medium">{t.name}</span>
                <div className="flex items-center gap-3">
                  {t.suggested_amount != null && (
                    <Badge variant="secondary">{formatCurrency(toMoney(t.suggested_amount))}</Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => removeTemplate(t.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-2 border-t pt-4">
            <div className="min-w-[160px] flex-1 space-y-1">
              <Label className="text-xs">Libellé</Label>
              <Input
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="Ex: Contribution APE"
              />
            </div>
            <div className="w-36 space-y-1">
              <Label className="text-xs">Montant suggéré</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={newTemplateAmount}
                onChange={e => setNewTemplateAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Optionnel"
              />
            </div>
            <Button type="button" disabled={isPending || !newTemplateName.trim()} onClick={addTemplate}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TuitionRateRow({
  row,
  disabled,
  onSave,
}: {
  row: TuitionGridRow
  disabled: boolean
  onSave: (row: TuitionGridRow, amount: string) => void
}) {
  const [value, setValue] = useState(row.amount != null ? String(toMoney(row.amount)) : '')

  return (
    <tr>
      <td className="px-4 py-3 font-medium">{row.label}</td>
      <td className="px-4 py-3 text-slate-600">
        {row.amount != null ? formatCurrency(row.amount) : '—'}
      </td>
      <td className="px-4 py-3">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="Ex: 75000"
          className="h-9 max-w-[140px]"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !value}
          onClick={() => onSave(row, value)}
        >
          Enregistrer
        </Button>
      </td>
    </tr>
  )
}
