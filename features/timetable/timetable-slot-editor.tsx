'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { updateTimetableSlot, deleteOwnTimetableSlot } from '@/lib/actions/timetable'
import { notify } from '@/lib/feedback/toast'
import type { TimetableSlotView } from '@/lib/timetable/types'
import { Clock, Trash2 } from 'lucide-react'

type TimetableSlotEditorProps = {
  slot: TimetableSlotView
  editable: boolean
  showTeacher?: boolean
  onUpdated?: () => void
}

export function TimetableSlotEditor({
  slot,
  editable,
  showTeacher = false,
  onUpdated,
}: TimetableSlotEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [dayOfWeek, setDayOfWeek] = useState(String(slot.dayOfWeek))
  const [startTime, setStartTime] = useState(slot.startTime)
  const [endTime, setEndTime] = useState(slot.endTime)
  const [room, setRoom] = useState(slot.room ?? '')

  const hasChanges =
    dayOfWeek !== String(slot.dayOfWeek) ||
    startTime !== slot.startTime ||
    endTime !== slot.endTime ||
    room !== (slot.room ?? '')

  function handleSave() {
    startTransition(async () => {
      const result = await updateTimetableSlot(slot.id, {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || null,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Horaire enregistré')
      onUpdated?.()
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer ce créneau ?')) return
    startTransition(async () => {
      const result = await deleteOwnTimetableSlot(slot.id)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Créneau supprimé')
      onUpdated?.()
    })
  }

  if (!editable) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">{slot.subjectName}</p>
            <p className="text-xs text-[#1B3A6B] font-medium">{slot.className}</p>
            {showTeacher && (
              <p className="text-xs text-gray-500 mt-0.5">{slot.teacherName}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" />
              {slot.startTime} – {slot.endTime}
            </p>
            {slot.room && <p className="text-[10px] text-gray-400 mt-0.5">Salle {slot.room}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#1B3A6B]/15 bg-white p-3 shadow-sm space-y-3">
      <div>
        <p className="text-sm font-bold text-gray-900">{slot.subjectName}</p>
        <p className="text-xs text-[#1B3A6B] font-medium">{slot.className}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Jour</label>
          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger className="h-9 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAY_NUMBERS.map(day => (
                <SelectItem key={day} value={String(day)}>
                  {DAY_LABELS[day]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Début</label>
          <Input
            type="time"
            value={startTime}
            onChange={event => setStartTime(event.target.value)}
            className="h-9 mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Fin</label>
          <Input
            type="time"
            value={endTime}
            onChange={event => setEndTime(event.target.value)}
            className="h-9 mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Salle</label>
          <Input
            value={room}
            onChange={event => setRoom(event.target.value)}
            placeholder="A12"
            className="h-9 mt-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Supprimer
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-[#1B3A6B] hover:bg-[#152d54]"
          onClick={handleSave}
          disabled={isPending || !hasChanges}
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
