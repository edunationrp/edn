'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { acceptStaffInvitation } from '@/lib/actions/staff'
import { notify } from '@/lib/feedback/toast'
import { ROLE_COLORS } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import { formatDate } from '@/lib/utils'

type JoinStaffClientProps = {
  token: string
  isLoggedIn: boolean
  preview: {
    schoolName: string
    roleCode: string
    roleLabel: string
    status: string
    expiresAt: string
    invitedName: string | null
    isExpired: boolean
    isValid: boolean
  } | null
  error?: string
}

export function JoinStaffClient({ token, isLoggedIn, preview, error }: JoinStaffClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [accepted, setAccepted] = useState(false)

  if (error || !preview) {
    return (
      <Card className="border-red-100">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <XCircle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-lg font-semibold">Invitation invalide</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {error ?? 'Ce lien d\'invitation n\'existe pas ou a été révoqué.'}
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Se connecter</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (accepted) {
    return (
      <Card className="border-green-100 bg-green-50/30">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle className="mb-4 h-12 w-12 text-green-600" />
          <h2 className="text-lg font-semibold text-green-900">Bienvenue dans l&apos;équipe !</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous avez rejoint <strong>{preview.schoolName}</strong> en tant que{' '}
            <strong>{preview.roleLabel}</strong>.
          </p>
          <Button asChild className="mt-6 bg-[#1a4d2e] hover:bg-[#2d6a4f]">
            <Link href="/dashboard">Accéder au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const invalid = !preview.isValid || preview.isExpired || preview.status !== 'pending'

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptStaffInvitation(token)
      if (result.error) {
        notify.error(result.error, 'join')
        return
      }
      setAccepted(true)
      notify.success('Invitation acceptée')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a4d2e]/10">
          <Shield className="h-7 w-7 text-[#1a4d2e]" />
        </div>
        <CardTitle>Invitation personnel EduNation</CardTitle>
        <CardDescription>
          {preview.invitedName ? `${preview.invitedName}, vous` : 'Vous'} êtes invité(e) à rejoindre une équipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/20 p-4 text-center">
          <p className="text-sm text-muted-foreground">Établissement</p>
          <p className="text-lg font-bold text-[#1B3A6B]">{preview.schoolName}</p>
          <div className="mt-3 flex justify-center">
            <Badge className={ROLE_COLORS[preview.roleCode as UserRole]}>
              {preview.roleLabel}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Expire le {formatDate(preview.expiresAt)}
          </p>
        </div>

        {invalid ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center text-sm text-amber-900">
            {preview.isExpired
              ? 'Cette invitation a expiré. Contactez le directeur pour un nouveau lien.'
              : 'Cette invitation n\'est plus disponible.'}
          </div>
        ) : !isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Connectez-vous ou créez un compte pour accepter l&apos;invitation.
            </p>
            <Button asChild className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]">
              <Link href={`/login?redirect=/join/staff/${token}`}>Se connecter</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/register/school?redirect=/join/staff/${token}`}>Créer un compte</Link>
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]"
            disabled={isPending}
            onClick={handleAccept}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Acceptation…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Accepter l&apos;invitation
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
