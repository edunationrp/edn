import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SuspensionAppealForm } from '@/features/auth/suspension-appeal-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    .select('id, full_name, default_role, is_active, account_status, suspension_reason, suspended_until')
    .eq('id', user.id)
    .limit(1)

  const profile = (profileRaw as Array<{
    id: string
    full_name: string | null
    default_role: string | null
    is_active: boolean
    account_status?: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY' | null
    suspension_reason?: string | null
    suspended_until?: string | null
  }> | null)?.[0]

  if (!profile) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileOperational } = await (supabase as any).rpc('is_profile_operational', { p_user_id: user.id })

  const profileStatus = profile.account_status ?? 'ACTIVE'
  const accountSuspended = !profile.is_active || profileStatus !== 'ACTIVE' || !profileOperational

  const { data: rolesRaw } = await supabase
    .from('user_school_roles')
    .select('school_id, role_code, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const roles = (rolesRaw as Array<{ school_id: string; role_code: string; is_active: boolean }> | null) ?? []
  const proviseurRole = roles.find(r => r.role_code === 'PROVISEUR') ?? null

  const schoolIds = [...new Set(roles.map(r => r.school_id))]
  const { data: schoolsRaw } = schoolIds.length
    ? await supabase
        .from('schools')
        .select('id, name, is_active, platform_status, status_reason, suspended_until')
        .in('id', schoolIds)
    : { data: [] }

  const schools = (schoolsRaw as Array<{
    id: string
    name: string
    is_active: boolean
    platform_status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | null
    status_reason?: string | null
    suspended_until?: string | null
  }> | null) ?? []

  const schoolOperationalPairs = await Promise.all(
    schools.map(async school => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('is_school_operational', { p_school_id: school.id })
      return { school, operational: Boolean(data) }
    })
  )
  const blockedSchool = schoolOperationalPairs.find(pair => !pair.operational)?.school ?? null

  if (!accountSuspended && !blockedSchool) {
    redirect('/dashboard')
  }

  const canAppeal = Boolean(proviseurRole)
  const accountMessage = profile.suspension_reason || 'Votre compte est temporairement suspendu.'
  const schoolMessage = blockedSchool?.status_reason || 'Votre établissement est suspendu par la super administration.'

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
              Votre accès à EduNation est momentanément restreint.
            </p>
          </div>
        </div>

        {accountSuspended && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="destructive">Suspension du compte</Badge>
              {profileStatus === 'SUSPENDED_TEMPORARY' && profile.suspended_until && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Jusqu&apos;au {new Date(profile.suspended_until).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700">{accountMessage}</p>
          </div>
        )}

        {!accountSuspended && blockedSchool && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="warning">Suspension établissement</Badge>
              {blockedSchool.suspended_until && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Jusqu&apos;au {new Date(blockedSchool.suspended_until).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700">{schoolMessage}</p>
          </div>
        )}

        {canAppeal ? (
          <SuspensionAppealForm schoolId={blockedSchool?.id ?? proviseurRole?.school_id ?? null} />
        ) : (
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
            Cette suspension doit être traitée par le proviseur de votre établissement.
          </div>
        )}

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
