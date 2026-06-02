'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { loginStaffMember, lookupStaffLoginSchools } from '@/lib/actions/auth-login'
import type { StaffSchoolOption } from '@/lib/staff/membership-auth'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
  schoolId: z.string().optional(),
})

type LoginData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const loginError = searchParams.get('error')
  const prefilledEmail = searchParams.get('email')?.trim() ?? ''
  const prefilledSchoolId = searchParams.get('school')?.trim() ?? ''

  const [showPassword, setShowPassword] = useState(false)
  const [schools, setSchools] = useState<StaffSchoolOption[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefilledEmail,
      schoolId: prefilledSchoolId || undefined,
    },
  })

  const emailValue = watch('email')
  const schoolIdValue = watch('schoolId')

  useEffect(() => {
    if (!prefilledEmail) return
    void loadSchools(prefilledEmail)
  }, [prefilledEmail])

  useEffect(() => {
    if (loginError === 'account_suspended') {
      notify.error('Compte suspendu. Contactez la super administration.')
      return
    }
    if (loginError === 'school_suspended') {
      notify.error('Votre établissement est suspendu ou désactivé.')
    }
  }, [loginError])

  async function loadSchools(email: string) {
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSchools([])
      return
    }

    setLoadingSchools(true)
    try {
      const result = await lookupStaffLoginSchools(trimmed)
      if ('schools' in result) {
        setSchools(result.schools)
        if (result.schools.length === 1) {
          setValue('schoolId', result.schools[0].schoolId)
        } else if (prefilledSchoolId && result.schools.some(s => s.schoolId === prefilledSchoolId)) {
          setValue('schoolId', prefilledSchoolId)
        }
      } else {
        setSchools([])
      }
    } finally {
      setLoadingSchools(false)
    }
  }

  async function onSubmit(data: LoginData) {
    const result = await loginStaffMember({
      contactEmail: data.email,
      password: data.password,
      schoolId: data.schoolId || (schools.length === 1 ? schools[0].schoolId : undefined),
    })

    if ('error' in result && result.error) {
      notify.error(result.error, 'auth_login')
      return
    }

    notify.success(TOAST_SUCCESS.login.title, { description: TOAST_SUCCESS.login.description })

    const destination =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/dashboard'
    router.push(destination)
    router.refresh()
  }

  const needsSchoolPicker = schools.length > 1

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="email"
            type="email"
            placeholder="votre@email.com"
            autoComplete="email"
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('email', {
              onBlur: () => {
                void loadSchools(emailValue)
              },
            })}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {loadingSchools && (
        <p className="text-xs text-muted-foreground">Recherche de vos établissements…</p>
      )}

      {needsSchoolPicker && (
        <div className="space-y-1.5">
          <Label htmlFor="schoolId">Établissement</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              id="schoolId"
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
              {...register('schoolId', { required: needsSchoolPicker })}
            >
              <option value="">Choisir votre établissement</option>
              {schools.map(school => (
                <option key={school.schoolId} value={school.schoolId}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Même email, mot de passe différent par établissement.
          </p>
          {!schoolIdValue && needsSchoolPicker && (
            <p className="text-xs text-destructive">Sélectionnez l&apos;établissement pour continuer.</p>
          )}
        </div>
      )}

      {schools.length === 1 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <span className="font-medium">Établissement :</span> {schools[0].schoolName}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-10 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" />
          <span className="text-muted-foreground">Se souvenir de moi</span>
        </label>
        <a href="/forgot-password" className="text-primary hover:underline">
          Mot de passe oublié ?
        </a>
      </div>

      <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" loading={isSubmitting}>
        Se connecter
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        Votre établissement n&apos;est pas encore inscrit ?{' '}
        <a href="/register/school" className="text-primary hover:underline font-medium">
          Inscrire mon école
        </a>
      </p>

      <div className="flex flex-col gap-1.5 border-t pt-3">
        <a
          href="/login/eleve"
          className="block rounded-md border py-2 text-center text-xs text-muted-foreground transition hover:border-[#1B3A6B]/40 hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]"
        >
          🎓 Connexion élève (IUN)
        </a>
        <a
          href="/login/parent"
          className="block rounded-md border py-2 text-center text-xs text-muted-foreground transition hover:border-[#1B3A6B]/40 hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]"
        >
          👨‍👩‍👧 Se connecter en tant que parent
        </a>
        <a
          href="/register/parent"
          className="block rounded-md border py-2 text-center text-xs text-muted-foreground transition hover:border-[#1B3A6B]/40 hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]"
        >
          Créer un compte parent
        </a>
      </div>
    </form>
  )
}
