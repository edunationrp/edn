'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, CheckCircle, XCircle, Loader2, LogOut, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { acceptStaffInvitation } from '@/lib/actions/staff'
import { StaffInvitationSignupForm } from '@/features/staff/staff-invitation-signup-form'
import { notify } from '@/lib/feedback/toast'
import { ROLE_COLORS } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import { formatDate } from '@/lib/utils'

function emailsMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return true
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

type JoinStaffClientProps = {
  token: string
  isLoggedIn: boolean
  loggedInEmail?: string | null
  preview: {
    schoolName: string
    roleCode: string
    roleLabel: string
    status: string
    expiresAt: string
    invitedName: string | null
    invitedEmail: string | null
    isExpired: boolean
    isValid: boolean
    teacherAssignments: Array<{
      classId: string
      subjectId: string
      className: string
      subjectName: string
    }>
  } | null
  error?: string
}

export function JoinStaffClient({
  token,
  isLoggedIn,
  loggedInEmail,
  preview,
  error,
}: JoinStaffClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSigningOut, startSignOut] = useTransition()

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

  const invalid = !preview.isValid || preview.isExpired || preview.status !== 'pending'
  const invitedEmail = preview.invitedEmail?.trim() ?? null
  const emailMismatch =
    isLoggedIn && !!invitedEmail && !emailsMatch(loggedInEmail, invitedEmail)

  const loginHref = invitedEmail
    ? `/login?email=${encodeURIComponent(invitedEmail)}&redirect=${encodeURIComponent(`/join/staff/${token}`)}`
    : `/login?redirect=${encodeURIComponent(`/join/staff/${token}`)}`

  function handleSignOutAndContinue(mode: 'signup' | 'login') {
    startSignOut(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      if (mode === 'login') {
        router.push(loginHref)
      } else {
        router.refresh()
      }
    })
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptStaffInvitation(token)
      if (result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Invitation acceptée — bienvenue dans l\'équipe !')
      router.push('/dashboard')
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
      <CardContent className="space-y-5">
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

        {preview.teacherAssignments.length > 0 && (
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Vos affectations</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Définies par la direction — vous complétez ensuite votre profil.
            </p>
            <ul className="mt-3 space-y-2">
              {preview.teacherAssignments.map(item => (
                <li
                  key={`${item.classId}-${item.subjectId}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">{item.className}</span>
                  <span className="text-slate-500"> · {item.subjectName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {invalid ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center text-sm text-amber-900">
            {preview.isExpired
              ? 'Cette invitation a expiré. Contactez le directeur pour un nouveau lien.'
              : 'Cette invitation n\'est plus disponible.'}
          </div>
        ) : emailMismatch ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              <p>
                Vous êtes connecté avec <strong>{loggedInEmail}</strong>, mais cette invitation
                est adressée à <strong>{invitedEmail}</strong>.
              </p>
              <p className="mt-2 text-xs text-amber-900/90">
                Utilisez le compte invité pour accepter — pas besoin d&apos;être connecté sur Gmail
                dans le navigateur, seulement sur EduNation.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]"
                disabled={isSigningOut}
                onClick={() => handleSignOutAndContinue('login')}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirection…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Se connecter avec {invitedEmail}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={isSigningOut}
                onClick={() => handleSignOutAndContinue('signup')}
              >
                <LogOut className="h-4 w-4" />
                Créer un compte avec {invitedEmail}
              </Button>
            </div>
          </div>
        ) : !isLoggedIn || !invitedEmail ? (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="mb-1 text-center text-sm font-semibold text-foreground">
                Finalisez votre compte
              </h3>
              <p className="mb-4 text-center text-xs text-muted-foreground">
                Complétez vos informations pour rejoindre {preview.schoolName}.
                Aucune connexion préalable requise — le lien d&apos;invitation suffit.
              </p>
              <StaffInvitationSignupForm
                token={token}
                invitedName={preview.invitedName}
                invitedEmail={preview.invitedEmail}
                loginHref={loginHref}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Connecté en tant que <strong>{loggedInEmail}</strong>. Confirmez pour accéder à
              votre espace <strong>{preview.roleLabel}</strong>.
            </p>
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
                  Accepter et accéder au tableau de bord
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
