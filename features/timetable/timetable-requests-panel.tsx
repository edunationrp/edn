'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { DAY_LABELS } from '@/lib/timetable/constants'
import { reviewTimetableChangeRequest } from '@/lib/actions/timetable'
import { notify } from '@/lib/feedback/toast'
import type { TimetableChangeRequestView } from '@/lib/timetable/types'
import { Inbox } from 'lucide-react'

type TimetableRequestsPanelProps = {
  requests: TimetableChangeRequestView[]
  canManage: boolean
}

export function TimetableRequestsPanel({ requests, canManage }: TimetableRequestsPanelProps) {
  const [isPending, startTransition] = useTransition()
  const pending = requests.filter(request => request.status === 'pending')

  function reviewRequest(requestId: string, decision: 'approved' | 'rejected') {
    startTransition(async () => {
      const result = await reviewTimetableChangeRequest(requestId, decision)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success(decision === 'approved' ? 'Demande approuvée — emploi du temps mis à jour' : 'Demande refusée')
    })
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1B3A6B] shadow-sm">
          <Inbox className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-bold text-slate-900">Aucune demande pour le moment</p>
        <p className="mt-1 text-sm text-slate-500">
          Les professeurs peuvent demander une modification depuis leur emploi du temps personnel.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-black text-slate-900">File de validation</p>
          <p className="text-xs text-slate-600">
            {pending.length} demande{pending.length !== 1 ? 's' : ''} en attente de votre décision.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
          Censeur
        </span>
      </div>

      <div className="grid gap-3">
        {requests.map(request => (
          <div
            key={request.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-black text-slate-900">
                  {request.subjectName} · {request.className}
                </p>
                <p className="text-xs text-slate-500">
                  Professeur : <span className="font-semibold text-slate-700">{request.teacherName}</span>
                </p>
                {request.currentStartTime && request.currentEndTime && request.currentDayOfWeek && (
                  <p className="text-xs text-slate-500">
                    Actuel : {DAY_LABELS[request.currentDayOfWeek]} {request.currentStartTime} – {request.currentEndTime}
                  </p>
                )}
                <p className="text-xs font-semibold text-[#1B3A6B]">
                  Souhaité : {DAY_LABELS[request.requestedDayOfWeek]} {request.requestedStartTime} – {request.requestedEndTime}
                  {request.requestedRoom ? ` · Salle ${request.requestedRoom}` : ''}
                </p>
                <p className="text-xs text-slate-500 italic">&laquo; {request.reason} &raquo;</p>
              </div>
              <span className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[11px] font-bold ${
                request.status === 'pending'
                  ? 'bg-amber-50 text-amber-700'
                  : request.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
              }`}>
                {request.status === 'pending' ? 'En attente' : request.status === 'approved' ? 'Approuvée' : 'Refusée'}
              </span>
            </div>

            {canManage && request.status === 'pending' && (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-50 pt-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:w-auto"
                  onClick={() => reviewRequest(request.id, 'rejected')}
                  disabled={isPending}
                >
                  Refuser
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                  onClick={() => reviewRequest(request.id, 'approved')}
                  disabled={isPending}
                >
                  Approuver et mettre à jour
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
