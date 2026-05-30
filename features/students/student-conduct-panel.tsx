'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MinusCircle, Plus } from 'lucide-react'
import { notify } from '@/lib/feedback/toast'
import {
  addConductPointDeduction,
  deleteConductPointDeduction,
} from '@/lib/actions/conduct'

type Deduction = {
  id: string
  term: string | null
  points: number
  reason: string
  deductedAt: string
}

type Props = {
  studentId: string
  initialDeductions: Deduction[]
  canManage?: boolean
}

export function StudentConductPanel({
  studentId,
  initialDeductions,
  canManage = true,
}: Props) {
  const [deductions, setDeductions] = useState(initialDeductions)
  const [points, setPoints] = useState('1')
  const [reason, setReason] = useState('')
  const [term, setTerm] = useState<'T1' | 'T2' | 'T3'>('T1')
  const [pending, startTransition] = useTransition()

  function handleAdd() {
    const parsedPoints = parseFloat(points.replace(',', '.'))
    if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
      notify.error('Indiquez un nombre de points valide.')
      return
    }
    if (!reason.trim()) {
      notify.error('Indiquez un motif.')
      return
    }

    startTransition(async () => {
      const result = await addConductPointDeduction({
        studentId,
        term,
        points: parsedPoints,
        reason: reason.trim(),
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Retrait de points enregistré.')
      setReason('')
      setPoints('1')
      window.location.reload()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteConductPointDeduction(id, studentId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      setDeductions(prev => prev.filter(item => item.id !== id))
      notify.success('Retrait supprimé.')
    })
  }

  const total = deductions.reduce((sum, item) => sum + item.points, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total retraits : <span className="font-semibold text-red-700">{total.toFixed(2)} pt</span>
        </p>
      </div>

      {deductions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun retrait de points enregistré.</p>
      ) : (
        <ul className="space-y-2">
          {deductions.map(item => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-red-700">−{item.points} pt</p>
                <p className="text-slate-700">{item.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {item.deductedAt}
                  {item.term && ` · ${item.term}`}
                </p>
              </div>
              {canManage && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 space-y-3">
          <p className="text-sm font-medium">Nouveau retrait de points</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={points}
                onChange={event => setPoints(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trimestre</Label>
              <select
                value={term}
                onChange={event => setTerm(event.target.value as 'T1' | 'T2' | 'T3')}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="T1">Trimestre 1</option>
                <option value="T2">Trimestre 2</option>
                <option value="T3">Trimestre 3</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>Motif</Label>
              <Input
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Ex. : bavardage répété"
              />
            </div>
          </div>
          <Button type="button" size="sm" disabled={pending} onClick={handleAdd}>
            {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Enregistrer le retrait
          </Button>
        </div>
      )}
    </div>
  )
}
