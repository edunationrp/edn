'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, UserCheck, XCircle } from 'lucide-react'
import { decideAdmission, returnAdmissionForCorrection } from '@/lib/actions/admissions'
import { notify } from '@/lib/feedback/toast'

type Props = {
  requestId: string
}

type DecisionMode = 'reject' | 'return' | null

const MIN_LENGTH = 10

export function AdmissionDecisionActions({ requestId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<DecisionMode>(null)
  const [comment, setComment] = useState('')
  const router = useRouter()

  const trimmed = comment.trim()
  const commentValid = trimmed.length >= MIN_LENGTH
  const remaining = Math.max(0, MIN_LENGTH - trimmed.length)

  function resetMode() {
    setMode(null)
    setComment('')
  }

  function confirmApprove() {
    startTransition(async () => {
      const result = await decideAdmission(requestId, 'active')
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      if ('iun' in result && result.iun) {
        notify.success('Admission validée', { description: `IUN généré : ${result.iun}` })
      } else {
        notify.success('Admission validée')
      }
      router.push('/dashboard/admissions/to-validate')
      router.refresh()
    })
  }

  function confirmReject() {
    if (!commentValid) {
      notify.error(`Motif de refus : au moins ${MIN_LENGTH} caractères requis.`)
      return
    }
    startTransition(async () => {
      const result = await decideAdmission(requestId, 'rejected', trimmed)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Admission refusée', {
        description: 'Le secrétariat a été notifié. Avis guichet disponible dans les archives.',
      })
      router.push('/dashboard/admissions/archived')
      router.refresh()
    })
  }

  function confirmReturn() {
    if (!commentValid) {
      notify.error(`Motif de correction : au moins ${MIN_LENGTH} caractères requis.`)
      return
    }
    startTransition(async () => {
      const result = await returnAdmissionForCorrection(requestId, trimmed)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Dossier renvoyé au secrétariat', {
        description: 'La secrétaire peut modifier les pièces et resoumettre le dossier.',
      })
      router.push('/dashboard/admissions/to-validate')
      router.refresh()
    })
  }

  if (mode === 'reject') {
    return (
      <DecisionPanel
        title="Refus définitif"
        description="Ce motif sera archivé et communiqué au parent au guichet. Action irréversible."
        tone="danger"
        comment={comment}
        onCommentChange={setComment}
        remaining={remaining}
        commentValid={commentValid}
        isPending={isPending}
        onCancel={resetMode}
        onConfirm={confirmReject}
        confirmLabel="Confirmer le refus"
        icon={<XCircle className="h-5 w-5" />}
      />
    )
  }

  if (mode === 'return') {
    return (
      <DecisionPanel
        title="Demande de correction"
        description="Le dossier repasse au secrétariat : les pièces validées devront être revérifiées après modification."
        tone="warning"
        comment={comment}
        onCommentChange={setComment}
        remaining={remaining}
        commentValid={commentValid}
        isPending={isPending}
        onCancel={resetMode}
        onConfirm={confirmReturn}
        confirmLabel="Renvoyer au secrétariat"
        icon={<RotateCcw className="h-5 w-5" />}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
      <Button
        size="sm"
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-50"
        disabled={isPending}
        onClick={() => setMode('reject')}
      >
        <XCircle className="h-4 w-4" />
        Refuser
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-200 text-amber-800 hover:bg-amber-50"
        disabled={isPending}
        onClick={() => setMode('return')}
      >
        <RotateCcw className="h-4 w-4" />
        Demander une correction
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        disabled={isPending}
        onClick={confirmApprove}
      >
        <UserCheck className="h-4 w-4" />
        Valider l&apos;admission
      </Button>
    </div>
  )
}

type PanelProps = {
  title: string
  description: string
  tone: 'danger' | 'warning'
  comment: string
  onCommentChange: (v: string) => void
  remaining: number
  commentValid: boolean
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  icon: ReactNode
}

function DecisionPanel({
  title,
  description,
  tone,
  comment,
  onCommentChange,
  remaining,
  commentValid,
  isPending,
  onCancel,
  onConfirm,
  confirmLabel,
  icon,
}: PanelProps) {
  const border = tone === 'danger' ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'
  const titleColor = tone === 'danger' ? 'text-red-900' : 'text-amber-900'

  return (
    <div className={`rounded-lg border p-4 ${border}`}>
      <div className="mb-3 flex items-start gap-3">
        <div className={tone === 'danger' ? 'text-red-600' : 'text-amber-600'}>{icon}</div>
        <div>
          <p className={`font-semibold ${titleColor}`}>{title}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Motif <span className="text-red-600">*</span>
      </label>
      <textarea
        value={comment}
        onChange={e => onCommentChange(e.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5F941F] focus:outline-none focus:ring-1 focus:ring-[#5F941F]"
        placeholder="Saisissez un motif clair et professionnel pour le parent et le secrétariat…"
      />
      <p className="mt-1 text-xs text-slate-500">
        {commentValid
          ? 'Motif suffisant.'
          : `Encore ${remaining} caractère${remaining > 1 ? 's' : ''} minimum.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={onCancel}>
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={isPending || !commentValid}
          className={tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
          variant={tone === 'danger' ? 'default' : 'default'}
          onClick={onConfirm}
        >
          {tone === 'danger' && <AlertTriangle className="h-4 w-4" />}
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
