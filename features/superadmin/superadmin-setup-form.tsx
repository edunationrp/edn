'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, UserPlus, UserCheck, AlertTriangle, Eye, EyeOff, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { bootstrapSuperAdmin } from '@/lib/actions/superadmin-setup'
import { notify } from '@/lib/feedback/toast'

type SuperAdminSetupFormProps = {
  superAdminCount: number
  secretConfigured: boolean
  serviceRoleConfigured: boolean
  setupError: string | null
}

export function SuperAdminSetupForm({
  superAdminCount,
  secretConfigured,
  serviceRoleConfigured,
  setupError,
}: SuperAdminSetupFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'create' | 'promote'>('create')
  const [showPassword, setShowPassword] = useState(false)
  const [setupSecret, setSetupSecret] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const canSubmit =
    secretConfigured &&
    serviceRoleConfigured &&
    !setupError &&
    setupSecret.trim().length > 0 &&
    email.trim().length > 0 &&
    (mode === 'promote' || password.length >= 8)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await bootstrapSuperAdmin({
        setupSecret,
        mode,
        email,
        password: mode === 'create' ? password : undefined,
        firstName: mode === 'create' ? firstName : undefined,
        lastName: mode === 'create' ? lastName : undefined,
      })

      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }

      notify.success('Propriétaire plateforme créé', {
        description: result.message,
      })
      router.push('/login?redirect=/dashboard/platform')
    })
  }

  if (setupError || !serviceRoleConfigured) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="font-semibold text-red-900">Configuration incomplète</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {setupError ?? 'Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!secretConfigured) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-8 text-center text-sm text-amber-900">
          <p className="font-semibold">SUPERADMIN_SETUP_SECRET manquant</p>
          <p className="mt-2">
            Ajoutez dans <code className="rounded bg-white px-1">.env.local</code> :
          </p>
          <pre className="mt-3 rounded-lg bg-white p-3 text-left text-xs">
            SUPERADMIN_SETUP_SECRET=votre-code-secret-ici
          </pre>
          <p className="mt-3 text-xs opacity-80">Puis redémarrez <code>npm run dev</code>.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-violet-600" />
          Propriétaire plateforme EduNation
        </CardTitle>
        <CardDescription>
          Compte SaaS global — <strong>aucun établissement</strong> requis.
          {superAdminCount > 0 && ` ${superAdminCount} propriétaire(s) déjà actif(s).`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-3 text-sm text-violet-900">
          <Globe className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Ce compte administre toute la plateforme (écoles, organisations, utilisateurs).
            Il n&apos;est pas proviseur ni membre d&apos;un lycée.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-secret">Code secret de configuration</Label>
            <Input
              id="setup-secret"
              type="password"
              value={setupSecret}
              onChange={e => setSetupSecret(e.target.value)}
              placeholder="Valeur de SUPERADMIN_SETUP_SECRET"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2 rounded-xl border bg-slate-50/80 p-1">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-white text-violet-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Nouveau compte
            </button>
            <button
              type="button"
              onClick={() => setMode('promote')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'promote'
                  ? 'bg-white text-violet-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Compte existant
            </button>
          </div>

          {mode === 'create' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@edunation.bf"
              required
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-violet-700 hover:bg-violet-800"
            disabled={!canSubmit || isPending}
            loading={isPending}
          >
            <Shield className="h-4 w-4" />
            {mode === 'create' ? 'Créer le propriétaire plateforme' : 'Promouvoir en propriétaire plateforme'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Déjà configuré ?{' '}
          <Link href="/login" className="font-medium text-violet-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
