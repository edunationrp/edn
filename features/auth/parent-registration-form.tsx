'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Phone, User, KeyRound, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendParentOtp, verifyParentOtpAndRegister } from '@/lib/actions/parent-auth'
import Link from 'next/link'

type Step = 'phone' | 'verify'

const phoneSchema = z.object({
  phone: z.string().min(8, 'Numéro invalide').regex(/^\+?[0-9]{8,15}$/, 'Format invalide'),
})

const verifySchema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  code: z.string().length(6, '6 chiffres requis').regex(/^\d+$/, 'Chiffres uniquement'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(1, 'Requis'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type PhoneData = z.infer<typeof phoneSchema>
type VerifyData = z.infer<typeof verifySchema>

export function ParentRegistrationForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) })
  const verifyForm = useForm<VerifyData>({ resolver: zodResolver(verifySchema) })

  async function onSubmitPhone(data: PhoneData) {
    setServerError('')
    const result = await sendParentOtp(data.phone.trim())
    if (result.error) { setServerError(result.error); return }
    setPhone(data.phone.trim())
    setStep('verify')
  }

  async function onSubmitVerify(data: VerifyData) {
    setServerError('')
    const result = await verifyParentOtpAndRegister({
      phone,
      code: data.code.trim(),
      fullName: data.fullName.trim(),
      password: data.password,
    })
    if (result.error) { setServerError(result.error); return }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-green-800">Compte créé avec succès !</p>
        <p className="mt-1 text-xs text-green-700">Redirection vers la connexion…</p>
      </div>
    )
  }

  if (step === 'phone') {
    return (
      <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              {...phoneForm.register('phone')}
              placeholder="+226 70 00 00 00"
              inputMode="tel"
              className="pl-8"
              autoComplete="tel"
            />
          </div>
          {phoneForm.formState.errors.phone && (
            <p className="text-xs text-destructive">{phoneForm.formState.errors.phone.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={phoneForm.formState.isSubmitting}>
          {phoneForm.formState.isSubmitting ? 'Envoi…' : 'Recevoir le code'}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="hover:text-foreground hover:underline">Se connecter</Link>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={verifyForm.handleSubmit(onSubmitVerify)} className="space-y-3">
      <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Code envoyé au <strong>{phone}</strong>
      </div>

      <div className="space-y-1">
        <Label htmlFor="fullName">Nom complet</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="fullName" {...verifyForm.register('fullName')} placeholder="Prénom NOM" className="pl-8" />
        </div>
        {verifyForm.formState.errors.fullName && (
          <p className="text-xs text-destructive">{verifyForm.formState.errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="code">Code de vérification</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="code"
            {...verifyForm.register('code')}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="pl-8 tracking-widest"
          />
        </div>
        {verifyForm.formState.errors.code && (
          <p className="text-xs text-destructive">{verifyForm.formState.errors.code.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...verifyForm.register('password')}
            placeholder="Minimum 8 caractères"
            className="pl-8 pr-9"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {verifyForm.formState.errors.password && (
          <p className="text-xs text-destructive">{verifyForm.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input id="confirmPassword" type="password" {...verifyForm.register('confirmPassword')} autoComplete="new-password" />
        {verifyForm.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive">{verifyForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={verifyForm.formState.isSubmitting}>
        {verifyForm.formState.isSubmitting ? 'Création…' : 'Créer mon compte'}
      </Button>

      <button
        type="button"
        onClick={() => { setStep('phone'); setServerError('') }}
        className="w-full text-xs text-muted-foreground hover:text-foreground"
      >
        ← Changer de numéro
      </button>
    </form>
  )
}
