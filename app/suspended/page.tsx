import { redirect } from 'next/navigation'
import { AlertTriangle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ReturnToLoginButton } from '@/features/auth/return-to-login-button'
import { SuspensionAppealForm } from '@/features/auth/suspension-appeal-form'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compte suspendu',
}

export default async function SuspendedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .limit(1)
  const profile = (profileRaw as Array<{ full_name: string | null }> | null)?.[0]
  const displayName = profile?.full_name?.split(' ')[0] ?? 'Utilisateur'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: suspensionCtxRaw } = await (supabase as any).rpc('get_my_suspension_context')
  const suspensionCtx = (suspensionCtxRaw as Array<{
    account_blocked: boolean
    account_status: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY' | null
    account_reason: string | null
    account_suspended_until: string | null
    school_blocked: boolean
    school_id: string | null
    school_name: string | null
    school_reason: string | null
    school_suspended_until: string | null
    is_proviseur: boolean
  }> | null)?.[0]

  const accountSuspended = Boolean(suspensionCtx?.account_blocked)
  const schoolSuspended = Boolean(suspensionCtx?.school_blocked)

  if (!accountSuspended && !schoolSuspended) {
    redirect('/dashboard')
  }

  const canAppeal = Boolean(suspensionCtx?.is_proviseur)
  const accountMessage = suspensionCtx?.account_reason || 'Votre compte est temporairement suspendu.'
  const schoolMessage = suspensionCtx?.school_reason || 'Votre établissement est suspendu par la super administration.'

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center py-10">
      <div className="w-full space-y-5 rounded-2xl border bg-slate-50/40 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Accès suspendu</h1>
            <p className="text-sm text-slate-600">
              Bonjour {displayName}, votre accès à EduNation est momentanément restreint.
            </p>
          </div>
        </div>

        {accountSuspended && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="destructive">Suspension du compte</Badge>
              {suspensionCtx?.account_status === 'SUSPENDED_TEMPORARY' && suspensionCtx.account_suspended_until && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Jusqu&apos;au {new Date(suspensionCtx.account_suspended_until).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700">{accountMessage}</p>
          </div>
        )}

        {!accountSuspended && schoolSuspended && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="warning">Suspension établissement</Badge>
              {suspensionCtx?.school_suspended_until && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Jusqu&apos;au {new Date(suspensionCtx.school_suspended_until).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700">{schoolMessage}</p>
          </div>
        )}

        {canAppeal ? (
          <SuspensionAppealForm schoolId={suspensionCtx?.school_id ?? null} />
        ) : (
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
            Cette suspension doit être traitée par le proviseur de votre établissement.
          </div>
        )}

        <div className="flex justify-end">
          <ReturnToLoginButton />
        </div>
      </div>
    </div>
  )
}
