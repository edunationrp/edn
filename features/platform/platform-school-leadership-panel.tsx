'use client'

import { useMemo, useState, useTransition } from 'react'
import { Crown, Mail, Trash2, UserPlus, ArrowRightLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/feedback/toast'
import { ROLE_LABELS } from '@/types/roles'
import type {
  PlatformPendingProviseurInviteRow,
  PlatformSchoolLeaderRow,
  PlatformSchoolStaffCandidateRow,
} from '@/lib/platform/types'
import {
  invitePlatformSchoolProviseur,
  promotePlatformSchoolProviseur,
  removePlatformSchoolProviseur,
  transferPlatformSchoolLeadership,
} from '@/lib/actions/platform-school-leadership'
import { formatDate } from '@/lib/utils'

type Props = {
  schoolId: string
  schoolName: string
  leaders: PlatformSchoolLeaderRow[]
  staffCandidates: PlatformSchoolStaffCandidateRow[]
  pendingInvites: PlatformPendingProviseurInviteRow[]
}

export function PlatformSchoolLeadershipPanel({
  schoolId,
  schoolName,
  leaders,
  staffCandidates,
  pendingInvites,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [promoteUserId, setPromoteUserId] = useState('')
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<PlatformSchoolLeaderRow | null>(null)
  const [deleteAccount, setDeleteAccount] = useState(false)
  const [transferTarget, setTransferTarget] = useState<PlatformSchoolLeaderRow | null>(null)
  const [transferSuccessorId, setTransferSuccessorId] = useState('')
  const [transferDeleteAccount, setTransferDeleteAccount] = useState(false)

  const hasSuccessorCoverage = leaders.length > 1 || pendingInvites.length > 0 || staffCandidates.length > 0

  const promoteOptions = useMemo(() => {
    const leaderIds = new Set(leaders.map(leader => leader.userId))
    return staffCandidates.filter(candidate => !leaderIds.has(candidate.userId))
  }, [leaders, staffCandidates])

  function handleInvite() {
    startTransition(async () => {
      const result = await invitePlatformSchoolProviseur({
        schoolId,
        invitedEmail: inviteEmail,
        invitedName: inviteName || undefined,
        sendEmail: true,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      setLastInviteUrl(result.inviteUrl)
      setInviteEmail('')
      setInviteName('')

      if (result.emailSent) {
        notify.success('Invitation proviseur envoyée')
      } else {
        notify.success('Invitation créée', {
          description: result.emailWarning ?? 'Copiez le lien ci-dessous si besoin.',
        })
      }
    })
  }

  function handlePromote() {
    if (!promoteUserId) {
      notify.warning('Sélectionnez un membre du personnel.')
      return
    }

    startTransition(async () => {
      const result = await promotePlatformSchoolProviseur({
        schoolId,
        userId: promoteUserId,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      setPromoteUserId('')
      notify.success('Nouveau proviseur désigné')
    })
  }

  function handleRemove() {
    if (!removeTarget) return

    startTransition(async () => {
      const result = await removePlatformSchoolProviseur({
        schoolId,
        userId: removeTarget.userId,
        deleteAccount,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      setRemoveTarget(null)
      setDeleteAccount(false)
      notify.success(
        deleteAccount
          ? 'Proviseur retiré et compte supprimé si possible'
          : 'Proviseur retiré de l\'établissement',
      )
    })
  }

  function handleTransfer() {
    if (!transferTarget || !transferSuccessorId) {
      notify.warning('Choisissez un successeur.')
      return
    }

    startTransition(async () => {
      const result = await transferPlatformSchoolLeadership({
        schoolId,
        outgoingUserId: transferTarget.userId,
        incomingUserId: transferSuccessorId,
        deleteOutgoingAccount: transferDeleteAccount,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      setTransferTarget(null)
      setTransferSuccessorId('')
      setTransferDeleteAccount(false)
      notify.success('Passation de direction effectuée')
    })
  }

  return (
    <Card className="border-amber-200/80 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-amber-700" />
          Direction de l&apos;établissement
        </CardTitle>
        <CardDescription>
          Gérez le proviseur de {schoolName}. L&apos;école reste intacte : seul le compte directeur change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">Proviseur(s) actuel(s)</p>
          {leaders.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-white px-4 py-3 text-sm text-muted-foreground">
              Aucun directeur actif. Invitez ou promouvez un remplaçant pour reprendre le contrôle.
            </p>
          ) : (
            leaders.map(leader => (
              <div
                key={leader.id}
                className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {leader.fullName ?? 'Sans nom'}
                    {leader.isFounder && (
                      <Badge variant="secondary" className="ml-2">Fondateur</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{leader.email ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[leader.roleCode as keyof typeof ROLE_LABELS] ?? leader.roleCode}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {promoteOptions.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setTransferTarget(leader)
                        setTransferSuccessorId('')
                        setTransferDeleteAccount(false)
                      }}
                    >
                      <ArrowRightLeft className="mr-1 h-4 w-4" />
                      Passer la main
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isPending || (!hasSuccessorCoverage && leaders.length <= 1)}
                    onClick={() => {
                      setRemoveTarget(leader)
                      setDeleteAccount(false)
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Retirer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Invitation(s) proviseur en attente</p>
            {pendingInvites.map(invite => (
              <div key={invite.id} className="rounded-xl border bg-white px-4 py-3 text-sm">
                <p className="font-medium">{invite.invitedName ?? invite.invitedEmail ?? 'Invitation'}</p>
                <p className="text-muted-foreground">{invite.invitedEmail}</p>
                <p className="text-xs text-muted-foreground">Expire le {formatDate(invite.expiresAt)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#1B3A6B]" />
              <p className="font-medium text-slate-900">Inviter un nouveau proviseur</p>
            </div>
            <p className="text-sm text-muted-foreground">
              La personne recevra un lien pour créer son accès directeur. Une invitation en attente suffit pour retirer l&apos;ancien proviseur.
            </p>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={event => setInviteEmail(event.target.value)}
                placeholder="nouveau.proviseur@exemple.cd"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nom complet (optionnel)</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={event => setInviteName(event.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
            <Button type="button" disabled={isPending || !inviteEmail.trim()} onClick={handleInvite}>
              Envoyer l&apos;invitation
            </Button>
            {lastInviteUrl && (
              <p className="break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Lien : {lastInviteUrl}
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#1B3A6B]" />
              <p className="font-medium text-slate-900">Promouvoir un membre existant</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Choisissez quelqu&apos;un déjà dans l&apos;établissement (secrétaire, censeur, etc.) pour reprendre la direction immédiatement.
            </p>
            <Select value={promoteUserId} onValueChange={setPromoteUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Membre du personnel" />
              </SelectTrigger>
              <SelectContent>
                {promoteOptions.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Aucun membre éligible
                  </SelectItem>
                ) : (
                  promoteOptions.map(candidate => (
                    <SelectItem key={candidate.userId} value={candidate.userId}>
                      {candidate.fullName ?? candidate.email ?? candidate.userId} —{' '}
                      {ROLE_LABELS[candidate.roleCode as keyof typeof ROLE_LABELS] ?? candidate.roleCode}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending || !promoteUserId}
              onClick={handlePromote}
            >
              Promouvoir proviseur
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={Boolean(removeTarget)} onOpenChange={open => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le proviseur</DialogTitle>
            <DialogDescription>
              {removeTarget?.fullName ?? removeTarget?.email} perdra l&apos;accès direction de{' '}
              {schoolName}. L&apos;établissement, ses élèves et ses données ne seront pas supprimés.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="delete-account" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <input
              id="delete-account"
              type="checkbox"
              className="mt-1"
              checked={deleteAccount}
              onChange={event => setDeleteAccount(event.target.checked)}
            />
            <span className="leading-snug">
              Supprimer aussi le compte utilisateur s&apos;il n&apos;a plus d&apos;accès à cet établissement
            </span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleRemove}>
              Confirmer le retrait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(transferTarget)} onOpenChange={open => !open && setTransferTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passation de direction</DialogTitle>
            <DialogDescription>
              Promouvez un successeur puis retirez {transferTarget?.fullName ?? 'le proviseur actuel'} en une seule opération.
            </DialogDescription>
          </DialogHeader>
          <Select value={transferSuccessorId} onValueChange={setTransferSuccessorId}>
            <SelectTrigger>
              <SelectValue placeholder="Nouveau proviseur" />
            </SelectTrigger>
            <SelectContent>
              {promoteOptions.map(candidate => (
                <SelectItem key={candidate.userId} value={candidate.userId}>
                  {candidate.fullName ?? candidate.email ?? candidate.userId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label htmlFor="transfer-delete-account" className="flex items-start gap-2 rounded-lg border p-3 text-sm">
            <input
              id="transfer-delete-account"
              type="checkbox"
              className="mt-1"
              checked={transferDeleteAccount}
              onChange={event => setTransferDeleteAccount(event.target.checked)}
            />
            <span className="leading-snug">
              Supprimer le compte de l&apos;ancien proviseur après la passation
            </span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTransferTarget(null)}>
              Annuler
            </Button>
            <Button type="button" disabled={isPending || !transferSuccessorId} onClick={handleTransfer}>
              Effectuer la passation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
