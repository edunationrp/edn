'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Mail, RefreshCw, UserMinus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notify } from '@/lib/feedback/toast'
import { ROLE_LABELS } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import type { TeacherAssignmentRow } from '@/lib/staff/teacher-assignments'
import {
  getStaffMemberTeacherAssignments,
  inviteTeacherReplacement,
  reassignTeacherClassesToMember,
  removeStaffMemberFromSchool,
  removeTeacherFromClass,
} from '@/lib/actions/staff'

type ManageMember = {
  id: string
  userId: string
  roleCode: UserRole
  fullName: string
  email: string
}

type Props = {
  member: ManageMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherMembers: ManageMember[]
}

export function StaffMemberManageDialog({
  member,
  open,
  onOpenChange,
  teacherMembers,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [assignments, setAssignments] = useState<TeacherAssignmentRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [incomingMemberId, setIncomingMemberId] = useState('')
  const [deleteAccountOnLeave, setDeleteAccountOnLeave] = useState(false)

  const isTeacher = member?.roleCode === 'PROFESSEUR'
  const otherTeachers = useMemo(
    () => teacherMembers.filter(row => row.id !== member?.id && row.roleCode === 'PROFESSEUR'),
    [teacherMembers, member?.id],
  )

  useEffect(() => {
    if (!open || !member || !isTeacher) {
      setAssignments([])
      setSelectedIds([])
      return
    }

    setLoadingAssignments(true)
    getStaffMemberTeacherAssignments(member.id)
      .then(result => {
        if ('error' in result) {
          notify.error(result.error)
          setAssignments([])
          return
        }
        setAssignments(result.assignments)
        setSelectedIds(result.assignments.map(row => row.id))
      })
      .finally(() => setLoadingAssignments(false))
  }, [open, member, isTeacher])

  function toggleAssignment(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id],
    )
  }

  function refreshAssignments() {
    if (!member) return
    startTransition(async () => {
      const result = await getStaffMemberTeacherAssignments(member.id)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      setAssignments(result.assignments)
      setSelectedIds(result.assignments.map(row => row.id))
    })
  }

  function handleRemoveFromClass(assignmentId: string) {
    startTransition(async () => {
      const result = await removeTeacherFromClass(assignmentId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Professeur retiré de la classe', {
        description: 'Les notes déjà saisies sont conservées.',
      })
      refreshAssignments()
    })
  }

  function handleInviteReplacement(removeFromSchoolAfter: boolean) {
    if (!member) return
    if (!selectedIds.length) {
      notify.warning('Sélectionnez au moins une classe.')
      return
    }
    if (!inviteEmail.trim()) {
      notify.warning('Indiquez l\'email du remplaçant.')
      return
    }

    startTransition(async () => {
      const result = await inviteTeacherReplacement({
        outgoingMemberRoleId: member.id,
        assignmentIds: selectedIds,
        invitedEmail: inviteEmail.trim(),
        invitedName: inviteName.trim() || undefined,
        sendEmail: true,
        removeFromSchoolAfter,
        deleteAccountAfter: removeFromSchoolAfter && deleteAccountOnLeave,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      setInviteEmail('')
      setInviteName('')
      notify.success(
        removeFromSchoolAfter
          ? 'Remplaçant invité et départ enregistré'
          : 'Invitation envoyée au remplaçant',
        {
          description: result.emailWarning ?? 'Le nouveau professeur reprendra les mêmes classes.',
        },
      )
      if (!removeFromSchoolAfter) refreshAssignments()
      else {
        router.refresh()
        onOpenChange(false)
      }
    })
  }

  function handleReassignToExisting() {
    if (!member) return
    if (!selectedIds.length) {
      notify.warning('Sélectionnez au moins une classe.')
      return
    }
    if (!incomingMemberId) {
      notify.warning('Choisissez le professeur remplaçant.')
      return
    }

    startTransition(async () => {
      const result = await reassignTeacherClassesToMember({
        outgoingMemberRoleId: member.id,
        incomingMemberRoleId: incomingMemberId,
        assignmentIds: selectedIds,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      notify.success('Classes transférées', {
        description: 'Le remplaçant continue sur les mêmes classes. Les notes existantes sont conservées.',
      })
      refreshAssignments()
      router.refresh()
    })
  }

  function handleLeaveSchool() {
    if (!member) return

    startTransition(async () => {
      const result = await removeStaffMemberFromSchool(member.id, {
        deleteAccount: deleteAccountOnLeave,
      })

      if ('error' in result) {
        notify.error(result.error)
        return
      }

      notify.success(
        deleteAccountOnLeave && result.accountDeleted
          ? 'Membre retiré et compte supprimé'
          : 'Membre retiré de l\'établissement',
        {
          description: 'Les données pédagogiques saisies (notes, évaluations) restent archivées.',
        },
      )
      router.refresh()
      onOpenChange(false)
    })
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle>Gérer {member.fullName}</DialogTitle>
          <DialogDescription>
            {ROLE_LABELS[member.roleCode]} — {member.email || 'Sans email'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isTeacher ? (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#1B3A6B]" />
                    <h3 className="text-sm font-semibold text-slate-900">Classes et matières</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending || loadingAssignments}
                    onClick={refreshAssignments}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Retirer d&apos;une classe n&apos;efface pas les notes déjà saisies.
                </p>

                {loadingAssignments ? (
                  <p className="text-sm text-muted-foreground">Chargement des affectations…</p>
                ) : assignments.length === 0 ? (
                  <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Aucune affectation active.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map(row => (
                      <div
                        key={row.id}
                        className="flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <label className="flex min-w-0 flex-1 items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleAssignment(row.id)}
                          />
                          <span>
                            <span className="font-medium text-slate-900">{row.className}</span>
                            <span className="text-muted-foreground"> · {row.subjectName}</span>
                          </span>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleRemoveFromClass(row.id)}
                        >
                          Retirer de cette classe
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {assignments.length > 0 && (
                <section className="space-y-3 rounded-xl border bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#1B3A6B]" />
                    <h3 className="text-sm font-semibold text-slate-900">Remplacer sur les classes sélectionnées</h3>
                  </div>

                  <Tabs defaultValue="invite">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="invite">Inviter un nouveau prof</TabsTrigger>
                      <TabsTrigger value="existing">Prof existant</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invite" className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="replacement-email">Email du remplaçant</Label>
                        <Input
                          id="replacement-email"
                          type="email"
                          value={inviteEmail}
                          onChange={event => setInviteEmail(event.target.value)}
                          placeholder="prof.remplacant@exemple.cd"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="replacement-name">Nom (optionnel)</Label>
                        <Input
                          id="replacement-name"
                          value={inviteName}
                          onChange={event => setInviteName(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleInviteReplacement(false)}
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Inviter le remplaçant
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleInviteReplacement(true)}
                        >
                          Inviter et retirer l&apos;ancien
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="existing" className="mt-4 space-y-3">
                      <Select value={incomingMemberId} onValueChange={setIncomingMemberId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Professeur remplaçant" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherTeachers.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              Aucun autre professeur disponible
                            </SelectItem>
                          ) : (
                            otherTeachers.map(teacher => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button type="button" disabled={isPending || !otherTeachers.length} onClick={handleReassignToExisting}>
                        Transférer les classes sélectionnées
                      </Button>
                    </TabsContent>
                  </Tabs>
                </section>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Changez le rôle depuis l&apos;onglet Équipe. Utilisez la section ci-dessous pour un départ définitif.
            </p>
          )}

          <section className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-4">
            <div className="flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-red-700" />
              <h3 className="text-sm font-semibold text-red-900">Départ définitif de l&apos;établissement</h3>
            </div>
            <p className="text-sm text-red-900/80">
              Retire l&apos;accès à l&apos;école. Les notes, bulletins et historiques pédagogiques déjà enregistrés restent dans le système.
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={deleteAccountOnLeave}
                onChange={event => setDeleteAccountOnLeave(event.target.checked)}
              />
              <span>
                Supprimer aussi le compte utilisateur s&apos;il n&apos;a plus d&apos;accès à cet établissement
              </span>
            </label>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleLeaveSchool}>
              Retirer de l&apos;établissement
            </Button>
          </section>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
