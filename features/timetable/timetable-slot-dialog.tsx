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
import { DAY_LABELS } from '@/lib/timetable/constants'
import {
  createTimetableChangeRequest,
  createTimetableSlot,
  deleteTimetableSlot,
  updateTimetableSlot,
} from '@/lib/actions/timetable'
import { notify } from '@/lib/feedback/toast'
import type { TimetableSlotView, TimetableStaffAssignment } from '@/lib/timetable/types'
import { Clock, Trash2 } from 'lucide-react'

export type SlotDialogMode = 'add' | 'edit' | 'request'

type TimetableSlotDialogProps = {
  open: boolean
  mode: SlotDialogMode
  slot: TimetableSlotView | null
  assignments: TimetableStaffAssignment[]
  selectedClassId: string
  defaultDay?: number
  defaultStart?: string
  defaultEnd?: string
  onClose: () => void
}

type SlotDialogFormProps = Omit<TimetableSlotDialogProps, 'open' | 'onClose'> & {
  onClose: () => void
}

function buildInitialState(props: SlotDialogFormProps) {
  const classAssignments = props.assignments.filter(item => item.classId === props.selectedClassId)
  if (props.mode === 'edit' && props.slot) {
    return {
      assignmentId: '',
      dayOfWeek: String(props.slot.dayOfWeek),
      startTime: props.slot.startTime,
      endTime: props.slot.endTime,
      room: props.slot.room ?? '',
      description: props.slot.description ?? '',
      reason: '',
    }
  }
  if (props.mode === 'request' && props.slot) {
    return {
      assignmentId: '',
      dayOfWeek: String(props.slot.dayOfWeek),
      startTime: props.slot.startTime,
      endTime: props.slot.endTime,
      room: props.slot.room ?? '',
      description: props.slot.description ?? '',
      reason: '',
    }
  }
  return {
    assignmentId: classAssignments[0]?.id ?? '',
    dayOfWeek: String(props.defaultDay ?? 1),
    startTime: props.defaultStart ?? '08:00',
    endTime: props.defaultEnd ?? '09:00',
    room: '',
    description: '',
    reason: '',
  }
}

function SlotDialogForm({
  mode,
  slot,
  assignments,
  selectedClassId,
  defaultDay,
  defaultStart,
  defaultEnd,
  onClose,
}: SlotDialogFormProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(() =>
    buildInitialState({ mode, slot, assignments, selectedClassId, defaultDay, defaultStart, defaultEnd, onClose }),
  )

  const classAssignments = assignments.filter(item => item.classId === selectedClassId)

  function handleSubmit() {
    startTransition(async () => {
      if (mode === 'request' && slot) {
        const result = await createTimetableChangeRequest(slot.id, {
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room || null,
          reason: form.reason,
        })
        if ('error' in result && result.error) {
          notify.error(result.error)
          return
        }
        notify.success('Demande envoyée au censeur')
        onClose()
        return
      }

      if (mode === 'edit' && slot) {
        const result = await updateTimetableSlot(slot.id, {
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room || null,
          description: form.description || null,
        })
        if ('error' in result && result.error) {
          notify.error(result.error)
          return
        }
        notify.success('Créneau mis à jour')
        onClose()
        return
      }

      const selected = classAssignments.find(item => item.id === form.assignmentId)
      if (!selected) {
        notify.error('Sélectionnez une matière et un professeur.')
        return
      }

      const result = await createTimetableSlot({
        classId: selected.classId,
        subjectId: selected.subjectId,
        teacherId: selected.teacherId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room || null,
        description: form.description || null,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Créneau ajouté à l\'emploi du temps')
      onClose()
    })
  }

  function handleDelete() {
    if (!slot || !confirm('Supprimer ce créneau de l\'emploi du temps ?')) return
    startTransition(async () => {
      const result = await deleteTimetableSlot(slot.id)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Créneau supprimé')
      onClose()
    })
  }

  const titles: Record<SlotDialogMode, string> = {
    add: 'Ajouter un cours',
    edit: 'Modifier le créneau',
    request: 'Demander une modification',
  }

  const descriptions: Record<SlotDialogMode, string> = {
    add: 'Planifiez un nouveau cours pour la classe sélectionnée.',
    edit: 'Ajustez l\'horaire officiel de ce créneau.',
    request: 'Votre demande sera transmise au censeur pour validation.',
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{titles[mode]}</DialogTitle>
        <DialogDescription>{descriptions[mode]}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {mode === 'add' && (
          <div>
            <label className="text-xs font-bold text-slate-500">Matière / professeur</label>
            <select
              value={form.assignmentId}
              onChange={event => setForm(current => ({ ...current, assignmentId: event.target.value }))}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
            >
              {classAssignments.length === 0 ? (
                <option value="">Aucune affectation pour cette classe</option>
              ) : (
                classAssignments.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.subjectName} · {item.teacherName}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {(mode === 'edit' || mode === 'request') && slot && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
            <p className="font-bold text-slate-900">{slot.subjectName}</p>
            <p className="text-slate-500">{slot.className} · {slot.teacherName}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold text-slate-500">Jour</label>
            <select
              value={form.dayOfWeek}
              onChange={event => setForm(current => ({ ...current, dayOfWeek: event.target.value }))}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(day => (
                <option key={day} value={day}>{DAY_LABELS[day]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Début</label>
            <Input
              type="time"
              value={form.startTime}
              onChange={event => setForm(current => ({ ...current, startTime: event.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Fin</label>
            <Input
              type="time"
              value={form.endTime}
              onChange={event => setForm(current => ({ ...current, endTime: event.target.value }))}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500">Salle</label>
          <Input
            value={form.room}
            onChange={event => setForm(current => ({ ...current, room: event.target.value }))}
            placeholder="Salle A2"
            className="mt-1"
          />
        </div>

        {mode !== 'request' && (
          <div>
            <label className="text-xs font-bold text-slate-500">Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
              placeholder="Ex. TP en salle informatique, sortie pédagogique..."
              className="mt-1 min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-[#7AB832]/50 focus:ring-2 focus:ring-[#7AB832]/20"
            />
          </div>
        )}

        {mode === 'request' && (
          <div>
            <label className="text-xs font-bold text-slate-500">Motif</label>
            <textarea
              value={form.reason}
              onChange={event => setForm(current => ({ ...current, reason: event.target.value }))}
              placeholder="Expliquez brièvement la contrainte ou le besoin de changement."
              className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-[#7AB832]/50 focus:ring-2 focus:ring-[#7AB832]/20"
            />
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {mode === 'edit' ? (
          <Button
            type="button"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="navy" onClick={handleSubmit} disabled={isPending}>
            <Clock className="h-4 w-4" />
            {mode === 'request' ? 'Envoyer au censeur' : mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

export function TimetableSlotDialog({
  open,
  mode,
  slot,
  assignments,
  selectedClassId,
  defaultDay = 1,
  defaultStart = '08:00',
  defaultEnd = '09:00',
  onClose,
}: TimetableSlotDialogProps) {
  const formKey = `${mode}-${slot?.id ?? 'new'}-${defaultDay}-${defaultStart}-${defaultEnd}-${selectedClassId}`

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {open && (
          <SlotDialogForm
            key={formKey}
            mode={mode}
            slot={slot}
            assignments={assignments}
            selectedClassId={selectedClassId}
            defaultDay={defaultDay}
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
