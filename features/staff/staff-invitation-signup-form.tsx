'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerStaffFromInvitation } from '@/lib/actions/staff'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/feedback/toast'

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional().refine(
    val => !val?.trim() || val.replace(/\D/g, '').length >= 8,
    { message: 'Numéro de téléphone invalide' },
  ),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function splitInvitedName(name: string | null | undefined) {
  if (!name?.trim()) return { firstName: '', lastName: '' }
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

type StaffInvitationSignupFormProps = {
  token: string
  invitedName?: string | null
  invitedEmail?: string | null
  loginHref?: string
  submitLabel?: string
  showLoginLink?: boolean
}

export function StaffInvitationSignupForm({
  token,
  invitedName,
  invitedEmail,
  loginHref,
  submitLabel = 'Créer mon compte et rejoindre l\'équipe',
  showLoginLink = true,
}: StaffInvitationSignupFormProps) {
  const resolvedLoginHref =
    loginHref ??
    (invitedEmail
      ? `/login?email=${encodeURIComponent(invitedEmail)}&redirect=${encodeURIComponent(`/join/staff/${token}`)}`
      : `/login?redirect=${encodeURIComponent(`/join/staff/${token}`)}`)
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const nameDefaults = splitInvitedName(invitedName)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: nameDefaults.firstName,
      lastName: nameDefaults.lastName,
      email: invitedEmail ?? '',
      phone: '',
    },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await registerStaffFromInvitation({
        token,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone?.trim() || undefined,
      })

      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        notify.error('Compte créé, mais connexion impossible. Connectez-vous manuellement.')
        router.push(`/login?redirect=${encodeURIComponent('/dashboard')}`)
        return
      }

      notify.success('Bienvenue dans l\'équipe !')
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" autoComplete="given-name" placeholder="Jean" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" autoComplete="family-name" placeholder="Dupont" {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          readOnly={!!invitedEmail}
          className={invitedEmail ? 'bg-muted/50' : undefined}
          {...register('email')}
        />
        {invitedEmail && (
          <p className="text-xs text-muted-foreground">
            Adresse utilisée pour l&apos;invitation — non modifiable.
          </p>
        )}
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="+226 70 00 00 00" {...register('phone')} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword(v => !v)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création du compte…
          </>
        ) : (
          submitLabel
        )}
      </Button>

      {showLoginLink && (
        <p className="text-center text-xs text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href={resolvedLoginHref} className="font-medium text-[#1a4d2e] hover:underline">
            Se connecter
          </Link>
        </p>
      )}
    </form>
  )
}
