'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { notify } from '@/lib/feedback/toast'
import {
  setPlatformUserActive,
  suspendPlatformUserTemporary,
} from '@/lib/actions/platform'

type PlatformUserStatusActionsProps = {
  userId: string
  isActive: boolean
  accountStatus: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY'
}

export function PlatformUserStatusActions({
  userId,
  isActive,
  accountStatus,
}: PlatformUserStatusActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmTotal, setConfirmTotal] = useState(false)
  const [confirmReactivate, setConfirmReactivate] = useState(false)
  const [tempDialogOpen, setTempDialogOpen] = useState(false)
  const [tempUntil, setTempUntil] = useState('')
  const [tempReason, setTempReason] = useState('')

  const canReactivate = accountStatus !== 'ACTIVE' || !isActive
  const canSuspendTotal = accountStatus !== 'SUSPENDED_TOTAL'

  function reactivate() {
    startTransition(async () => {
      const res = await setPlatformUserActive(userId, true)
      if ('error' in res && res.error) {
        notify.error(res.error)
        return
      }
      setConfirmReactivate(false)
      notify.success('Compte réactivé')
    })
  }

  function suspendTotal() {
    startTransition(async () => {
      const res = await setPlatformUserActive(userId, false)
      if ('error' in res && res.error) {
        notify.error(res.error)
        return
      }
      setConfirmTotal(false)
      notify.success('Suspension totale appliquée')
    })
  }

  function suspendTemporary() {
    if (!tempUntil) {
      notify.error('Choisissez une date de fin.')
      return
    }
    startTransition(async () => {
      const untilIso = new Date(tempUntil).toISOString()
      const res = await suspendPlatformUserTemporary(userId, tempReason, untilIso)
      if ('error' in res && res.error) {
        notify.error(res.error)
        return
      }
      setTempDialogOpen(false)
      setTempReason('')
      setTempUntil('')
      notify.success('Suspension temporaire appliquée')
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canReactivate || isPending} onSelect={() => setConfirmReactivate(true)}>
            Réactiver
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canSuspendTotal || isPending} onSelect={() => setConfirmTotal(true)}>
            Suspension totale
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onSelect={() => setTempDialogOpen(true)}>
            Suspension temporaire
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmReactivate}
        onOpenChange={setConfirmReactivate}
        title="Réactiver ce compte ?"
        description="Le compte retrouvera immédiatement ses accès selon ses rôles."
        confirmLabel="Réactiver"
        loading={isPending}
        onConfirm={reactivate}
      />

      <ConfirmDialog
        open={confirmTotal}
        onOpenChange={setConfirmTotal}
        title="Suspension totale ?"
        description="Le compte sera bloqué sur toute la plateforme jusqu'à réactivation."
        confirmLabel="Suspendre totalement"
        variant="destructive"
        loading={isPending}
        onConfirm={suspendTotal}
      />

      <Dialog open={tempDialogOpen} onOpenChange={setTempDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspension temporaire</DialogTitle>
            <DialogDescription>
              Configure la date de fin et un motif optionnel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              type="datetime-local"
              value={tempUntil}
              onChange={e => setTempUntil(e.target.value)}
            />
            <Input
              placeholder="Motif (optionnel)"
              value={tempReason}
              onChange={e => setTempReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setTempDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={isPending}
              onClick={suspendTemporary}
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
