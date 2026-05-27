'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { saveTimetableBreaks } from '@/lib/actions/timetable'
import { notify } from '@/lib/feedback/toast'
import type { TimetableBreakView } from '@/lib/timetable/types'
import { Coffee, Plus, Trash2, Utensils } from 'lucide-react'

type BreakFormRow = {
  key: string
  label: string
  breakType: 'pause' | 'lunch'
  startTime: string
  endTime: string
}

type TimetableBreaksDialogProps = {
  open: boolean
  breaks: TimetableBreakView[]
  onClose: () => void
}

function toFormRows(breaks: TimetableBreakView[]): BreakFormRow[] {
  return breaks.map((item, index) => ({
    key: item.id || `row-${index}`,
    label: item.label,
    breakType: item.breakType,
    startTime: item.startTime,
    endTime: item.endTime,
  }))
}

export function TimetableBreaksDialog({ open, breaks, onClose }: TimetableBreaksDialogProps) {
  const [rows, setRows] = useState<BreakFormRow[]>(() => toFormRows(breaks))
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(value: boolean) {
    if (value) setRows(toFormRows(breaks))
    else onClose()
  }

  function addRow() {
    setRows(current => [
      ...current,
      {
        key: `new-${Date.now()}`,
        label: 'Pause',
        breakType: 'pause',
        startTime: '09:30',
        endTime: '10:00',
      },
    ])
  }

  function removeRow(key: string) {
    setRows(current => current.filter(row => row.key !== key))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveTimetableBreaks(
        rows.map((row, index) => ({
          label: row.label.trim() || (row.breakType === 'lunch' ? 'Déjeuner' : 'Pause'),
          breakType: row.breakType,
          startTime: row.startTime,
          endTime: row.endTime,
          orderNum: index,
        })),
      )
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Pauses enregistrées')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurer les pauses</DialogTitle>
          <DialogDescription>
            Définissez les plages de pause et de déjeuner affichées sur la grille hebdomadaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aucune pause configurée. Ajoutez une pause ou un déjeuner.
            </p>
          )}

          {rows.map(row => (
            <div key={row.key} className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[1fr_120px_100px_100px_auto] sm:items-end">
              <div>
                <label className="text-xs font-bold text-slate-500">Libellé</label>
                <Input
                  value={row.label}
                  onChange={event => setRows(current =>
                    current.map(item => item.key === row.key ? { ...item, label: event.target.value } : item),
                  )}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Type</label>
                <select
                  value={row.breakType}
                  onChange={event => setRows(current =>
                    current.map(item =>
                      item.key === row.key
                        ? { ...item, breakType: event.target.value as 'pause' | 'lunch' }
                        : item,
                    ),
                  )}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
                >
                  <option value="pause">Pause</option>
                  <option value="lunch">Déjeuner</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Début</label>
                <Input
                  type="time"
                  value={row.startTime}
                  onChange={event => setRows(current =>
                    current.map(item => item.key === row.key ? { ...item, startTime: event.target.value } : item),
                  )}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Fin</label>
                <Input
                  type="time"
                  value={row.endTime}
                  onChange={event => setRows(current =>
                    current.map(item => item.key === row.key ? { ...item, endTime: event.target.value } : item),
                  )}
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => removeRow(row.key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" />
            Ajouter une pause
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="navy" onClick={handleSave} disabled={isPending}>
            {rows.some(row => row.breakType === 'pause') ? <Coffee className="h-4 w-4" /> : <Utensils className="h-4 w-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
