'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, Phone, User, Globe, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import { sendDirectorWelcomeEmailAction } from '@/lib/actions/auth-emails'
import { COUNTRIES, LANGUAGES } from '@/lib/onboarding/constants'
import { directorAccountSchema, type DirectorAccountValues } from '@/lib/onboarding/schemas'

type Props = {
  onSuccess: (fullName: string) => void
}

export function DirectorAccountStep({ onSuccess }: Props) {
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DirectorAccountValues>({
    resolver: zodResolver(directorAccountSchema),
    defaultValues: {
      country: 'BF',
      preferred_language: 'fr',
    },
  })

  async function onSubmit(values: DirectorAccountValues) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          phone: values.phone,
          country: values.country,
          preferred_language: values.preferred_language ?? 'fr',
          default_role: 'PROVISEUR',
        },
        emailRedirectTo: `${window.location.origin}/register/school`,
      },
    })

    if (error) {
      notify.error(error, 'auth_signup')
      return
    }

    if (data.session) {
      await sendDirectorWelcomeEmailAction({
        email: values.email,
        fullName: values.full_name,
      })
      notify.success('Compte directeur créé', {
        description: 'Passez à l\'inscription de votre établissement.',
      })
      onSuccess(values.full_name)
      return
    }

    notify.info(TOAST_SUCCESS.signupPendingEmail.title, {
      description: TOAST_SUCCESS.signupPendingEmail.description,
    })

    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
          <Mail className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Vérifiez votre email</h3>
        <p className="text-sm text-muted-foreground">
          Un lien de confirmation vous a été envoyé. Activez votre compte puis revenez
          pour configurer votre établissement.
        </p>
        <Button
          type="button"
          className="bg-[#1a4d2e] hover:bg-[#2d6a4f]"
          onClick={() => window.location.reload()}
        >
          J&apos;ai confirmé mon email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
        Identifiez un utilisateur unique et sécurisez l&apos;accès à votre espace directeur.
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nom complet *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="full_name" placeholder="M. Jean KABORE" className="pl-9" {...register('full_name')} />
        </div>
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email * (unique)</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="directeur@ecole.bf" className="pl-9" {...register('email')} />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone * (sécurité & récupération)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="phone" placeholder="+226 70 00 00 00" className="pl-9" {...register('phone')} />
        </div>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="country">Pays *</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <select
            id="country"
            {...register('country')}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="pl-9 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirmer *</Label>
          <Input
            id="confirm_password"
            type={showPassword ? 'text' : 'password'}
            {...register('confirm_password')}
          />
          {errors.confirm_password && (
            <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowOptional(v => !v)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 w-full"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
        Options (photo, langue, rôle)
      </button>

      {showOptional && (
        <div className="space-y-3 rounded-lg border bg-gray-50/80 p-4">
          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Input value="Directeur / Proviseur" disabled className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferred_language">Langue préférée</Label>
            <select
              id="preferred_language"
              {...register('preferred_language')}
              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Photo de profil : configurable depuis votre tableau de bord après l&apos;inscription.
          </p>
        </div>
      )}

      <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" loading={isSubmitting}>
        Continuer — Créer mon compte directeur
      </Button>
    </form>
  )
}
