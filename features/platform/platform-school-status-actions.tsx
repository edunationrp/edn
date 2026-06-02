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
import { setPlatformSchoolStatus } from '@/lib/actions/platform'

type SchoolPlatformStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED'

type PlatformSchoolStatusActionsProps = {
  schoolId: string
  currentStatus: SchoolPlatformStatus
}

export function PlatformSchoolStatusActions({
  schoolId,
  currentStatus,
}: PlatformSchoolStatusActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmStatus, setConfirmStatus] = useState<SchoolPlatformStatus | null>(null)
  const [tempDialogOpen, setTempDialogOpen] = useState(false)
  const [tempUntil, setTempUntil] = useState('')
  const [reason, setReason] = useState('')

  function applyStatus(status: SchoolPlatformStatus, suspendedUntilIso?: string | null) {
    startTransition(async () => {
      const result = await setPlatformSchoolStatus(schoolId, status, reason, suspendedUntilIso ?? null)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      setConfirmStatus(null)
      setTempDialogOpen(false)
      setTempUntil('')
      setReason('')
      notify.success(`Statut établissement: ${status}`)
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
          <DropdownMenuItem disabled={currentStatus === 'ACTIVE'} onSelect={() => setConfirmStatus('ACTIVE')}>
            Activer
          </DropdownMenuItem>
          <DropdownMenuItem disabled={currentStatus === 'SUSPENDED'} onSelect={() => setTempDialogOpen(true)}>
            Suspendre temporairement
          </DropdownMenuItem>
          <DropdownMenuItem disabled={currentStatus === 'DISABLED'} onSelect={() => setConfirmStatus('DISABLED')}>
            Désactiver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmStatus === 'ACTIVE'}
        onOpenChange={open => setConfirmStatus(open ? 'ACTIVE' : null)}
        title="Activer cet établissement ?"
        description="L'établissement redeviendra opérationnel pour son personnel."
        confirmLabel="Activer"
        loading={isPending}
        onConfirm={() => applyStatus('ACTIVE')}
      />

      <ConfirmDialog
        open={confirmStatus === 'DISABLED'}
        onOpenChange={open => setConfirmStatus(open ? 'DISABLED' : null)}
        title="Désactiver cet établissement ?"
        description="L'établissement sera bloqué durablement jusqu'à réactivation."
        confirmLabel="Désactiver"
        variant="destructive"
        loading={isPending}
        onConfirm={() => applyStatus('DISABLED')}
      />

      <Dialog open={tempDialogOpen} onOpenChange={setTempDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspension temporaire école</DialogTitle>
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
              value={reason}
              onChange={e => setReason(e.target.value)}
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
              onClick={() => {
                if (!tempUntil) {
                  notify.error('Date de fin requise.')
                  return
                }
                applyStatus('SUSPENDED', new Date(tempUntil).toISOString())
              }}
            >
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
