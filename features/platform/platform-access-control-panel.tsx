'use client'

import { useState, useTransition } from 'react'
import { Lock, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { notify } from '@/lib/feedback/toast'
import { reviewSuspensionAppeal, setPlatformSchoolStatus, setPlatformUserActive } from '@/lib/actions/platform'
import type {
  PlatformAccessControlSchoolRow,
  PlatformAccessControlUserRow,
  SuspensionAppealRow,
} from '@/lib/platform/types'
import { formatDate } from '@/lib/utils'

export function PlatformAccessControlPanel({
  suspendedUsers,
  restrictedSchools,
  pendingAppeals,
}: {
  suspendedUsers: PlatformAccessControlUserRow[]
  restrictedSchools: PlatformAccessControlSchoolRow[]
  pendingAppeals: SuspensionAppealRow[]
}) {
  const [isPending, startTransition] = useTransition()
  const [reactivateUserId, setReactivateUserId] = useState<string | null>(null)
  const [reactivateSchoolId, setReactivateSchoolId] = useState<string | null>(null)
  const [schoolReason, setSchoolReason] = useState('')
  const [appealNote, setAppealNote] = useState('')

  function reactivateUser(userId: string) {
    startTransition(async () => {
      const res = await setPlatformUserActive(userId, true)
      if ('error' in res && res.error) {
        notify.error(res.error)
        return
      }
      setReactivateUserId(null)
      notify.success('Utilisateur réactivé')
    })
  }

  function reactivateSchool(schoolId: string) {
    startTransition(async () => {
      const res = await setPlatformSchoolStatus(
        schoolId,
        'ACTIVE',
        schoolReason.trim() || 'Réactivation depuis contrôle d’accès'
      )
      if ('error' in res && res.error) {
        notify.error(res.error)
        return
      }
      setReactivateSchoolId(null)
      setSchoolReason('')
      notify.success('École réactivée')
    })
  }

  function reviewAppeal(appealId: string, status: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const res = await reviewSuspensionAppeal(appealId, status, appealNote)
      if ('error' in res && res.error) {
        notify.error(res.error)
        return
      }
      setAppealNote('')
      notify.success(status === 'APPROVED' ? 'Demande approuvée' : 'Demande rejetée')
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white lg:col-span-2">
        <div className="border-b px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-violet-600" />
            Demandes d&apos;annulation de suspension ({pendingAppeals.length})
          </h3>
        </div>
        <div className="max-h-[420px] space-y-2 overflow-auto p-3">
          {pendingAppeals.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              Aucune demande en attente.
            </p>
          ) : pendingAppeals.map(appeal => (
            <div key={appeal.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{appeal.requesterName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {appeal.requesterEmail ?? '—'} · {appeal.appealScope === 'ACCOUNT' ? 'Compte' : 'École'}
                    {appeal.schoolName ? ` · ${appeal.schoolName}` : ''}
                  </p>
                </div>
                <Badge variant="warning">En attente</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-700">{appeal.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                Soumise le {formatDate(appeal.createdAt)}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  placeholder="Note de revue (optionnel)"
                  value={appealNote}
                  onChange={e => setAppealNote(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => reviewAppeal(appeal.id, 'REJECTED')}
                >
                  Rejeter
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => reviewAppeal(appeal.id, 'APPROVED')}
                >
                  Approuver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="border-b px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-red-500" />
            Comptes suspendus ({suspendedUsers.length})
          </h3>
        </div>
        <div className="max-h-[460px] space-y-2 overflow-auto p-3">
          {suspendedUsers.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              Aucun compte suspendu.
            </p>
          ) : suspendedUsers.map(user => (
            <div key={user.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{user.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{user.email ?? '—'}</p>
                </div>
                <Badge variant={user.accountStatus === 'SUSPENDED_TOTAL' ? 'destructive' : 'warning'}>
                  {user.accountStatus === 'SUSPENDED_TOTAL' ? 'Totale' : 'Temporaire'}
                </Badge>
              </div>
              {user.suspensionReason && (
                <p className="mt-2 text-xs text-slate-600">Motif: {user.suspensionReason}</p>
              )}
              {user.suspendedUntil && (
                <p className="mt-1 text-xs text-slate-600">Jusqu&apos;au: {formatDate(user.suspendedUntil)}</p>
              )}
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setReactivateUserId(user.id)}
                >
                  Réactiver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="border-b px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            Écoles restreintes ({restrictedSchools.length})
          </h3>
        </div>
        <div className="max-h-[460px] space-y-2 overflow-auto p-3">
          {restrictedSchools.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              Aucune école suspendue/désactivée.
            </p>
          ) : restrictedSchools.map(school => (
            <div key={school.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{school.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[school.city, school.country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <Badge variant={school.platformStatus === 'DISABLED' ? 'destructive' : 'warning'}>
                  {school.platformStatus === 'DISABLED' ? 'Désactivée' : 'Suspendue'}
                </Badge>
              </div>
              {school.statusReason && (
                <p className="mt-2 text-xs text-slate-600">Motif: {school.statusReason}</p>
              )}
              {school.suspendedUntil && (
                <p className="mt-1 text-xs text-slate-600">Jusqu&apos;au: {formatDate(school.suspendedUntil)}</p>
              )}
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setReactivateSchoolId(school.id)}
                >
                  Réactiver l&apos;école
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(reactivateUserId)} onOpenChange={open => !open && setReactivateUserId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réactiver ce compte ?</DialogTitle>
            <DialogDescription>
              Le compte retrouvera immédiatement ses accès selon ses rôles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateUserId(null)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              onClick={() => reactivateUser(reactivateUserId!)}
              disabled={isPending || !reactivateUserId}
            >
              Réactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reactivateSchoolId)} onOpenChange={open => !open && setReactivateSchoolId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réactiver cette école ?</DialogTitle>
            <DialogDescription>
              L&apos;école sera de nouveau opérationnelle pour son personnel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              placeholder="Motif de réactivation (optionnel)"
              value={schoolReason}
              onChange={e => setSchoolReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateSchoolId(null)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              onClick={() => reactivateSchool(reactivateSchoolId!)}
              disabled={isPending || !reactivateSchoolId}
            >
              Réactiver l&apos;école
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
