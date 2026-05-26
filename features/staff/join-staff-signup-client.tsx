'use client'

import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaffInvitationSignupForm } from '@/features/staff/staff-invitation-signup-form'
import { ROLE_COLORS } from '@/types/roles'
import type { UserRole } from '@/types/roles'

type JoinStaffSignupClientProps = {
  token: string
  preview: {
    schoolName: string
    roleCode: string
    roleLabel: string
    invitedName: string | null
    invitedEmail: string | null
    isValid: boolean
    isExpired: boolean
    status: string
    teacherAssignments: Array<{
      classId: string
      subjectId: string
      className: string
      subjectName: string
    }>
  } | null
  error?: string
}

export function JoinStaffSignupClient({ token, preview, error }: JoinStaffSignupClientProps) {
  if (error || !preview || !preview.isValid || preview.isExpired || preview.status !== 'pending') {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error ?? 'Cette invitation n\'est plus valide.'}
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/join/staff/${token}`}>Retour à l&apos;invitation</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a4d2e]/10">
          <UserPlus className="h-6 w-6 text-[#1a4d2e]" />
        </div>
        <CardTitle>Créer votre compte</CardTitle>
        <CardDescription>
          Rejoignez <strong>{preview.schoolName}</strong>
        </CardDescription>
        <Badge className={`mx-auto mt-2 ${ROLE_COLORS[preview.roleCode as UserRole] ?? ''}`}>
          {preview.roleLabel}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview.teacherAssignments.length > 0 && (
          <div className="rounded-xl border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Affectations
            </p>
            <ul className="mt-2 space-y-1.5">
              {preview.teacherAssignments.map(item => (
                <li key={`${item.classId}-${item.subjectId}`} className="text-sm">
                  <span className="font-medium">{item.className}</span>
                  <span className="text-muted-foreground"> · {item.subjectName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <StaffInvitationSignupForm
          token={token}
          invitedName={preview.invitedName}
          invitedEmail={preview.invitedEmail}
        />
      </CardContent>
    </Card>
  )
}
