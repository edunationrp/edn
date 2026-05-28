'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Calendar,
  KeyRound,
  Mail,
  Phone,
  Smartphone,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  completeParentRegistration,
  sendParentRegistrationOtp,
  verifyParentRegistrationOtp,
} from '@/lib/actions/parent-auth'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Channel = 'phone' | 'gmail'
type Step = 'method' | 'otp-send' | 'otp-verify' | 'profile' | 'success'

const phoneSchema = z.object({
  phone: z.string().min(8, 'Numéro invalide').regex(/^\+?[0-9]{8,15}$/, 'Format invalide'),
})

const gmailSchema = z.object({
  email: z.string().email('Email invalide').regex(/^[^\s@]+@(gmail|googlemail)\.com$/i, 'Utilisez une adresse Gmail'),
})

const otpSchema = z.object({
  code: z.string().length(6, '6 chiffres requis').regex(/^\d+$/, 'Chiffres uniquement'),
})

const profileSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date requise'),
  phonePrimary: z.string().regex(/^\+?[0-9]{8,15}$/, 'Téléphone principal invalide'),
  phoneSecondary: z.string().optional(),
})

type SuccessState = {
  parentCode: string
  deliveryChannel: 'phone' | 'gmail'
  contactEmail: string | null
  phonePrimary: string
  devPassword?: string
}

export function ParentRegistrationForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('method')
  const [channel, setChannel] = useState<Channel>('phone')
  const [sessionId, setSessionId] = useState('')
  const [destination, setDestination] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState<SuccessState | null>(null)

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema) })
  const gmailForm = useForm<z.infer<typeof gmailSchema>>({ resolver: zodResolver(gmailSchema) })
  const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema) })
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phonePrimary: '',
      phoneSecondary: '',
    },
  })

  function chooseMethod(nextChannel: Channel) {
    setChannel(nextChannel)
    setServerError('')
    setStep('otp-send')
  }

  async function onSendPhone(data: z.infer<typeof phoneSchema>) {
    setServerError('')
    const phone = data.phone.trim()
    const result = await sendParentRegistrationOtp({ channel: 'phone', phone })
    if (result.error) { setServerError(result.error); return }
    setSessionId(result.sessionId!)
    setDestination(phone)
    profileForm.setValue('phonePrimary', phone)
    setStep('otp-verify')
  }

  async function onSendGmail(data: z.infer<typeof gmailSchema>) {
    setServerError('')
    const email = data.email.trim().toLowerCase()
    const result = await sendParentRegistrationOtp({ channel: 'gmail', email })
    if (result.error) { setServerError(result.error); return }
    setSessionId(result.sessionId!)
    setDestination(email)
    setStep('otp-verify')
  }

  async function onVerifyOtp(data: z.infer<typeof otpSchema>) {
    setServerError('')
    const result = await verifyParentRegistrationOtp({
      sessionId,
      code: data.code.trim(),
    })
    if (result.error) { setServerError(result.error); return }
    setStep('profile')
  }

  async function onCompleteProfile(data: z.infer<typeof profileSchema>) {
    setServerError('')
    const secondary = data.phoneSecondary?.trim()
    const result = await completeParentRegistration({
      sessionId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth,
      phonePrimary: data.phonePrimary.trim(),
      phoneSecondary: secondary && /^\+?[0-9]{8,15}$/.test(secondary) ? secondary : undefined,
    })
    if (result.error) { setServerError(result.error); return }
    setSuccess({
      parentCode: result.parentCode!,
      deliveryChannel: result.deliveryChannel!,
      contactEmail: result.contactEmail ?? null,
      phonePrimary: result.phonePrimary!,
      devPassword: result.devPassword,
    })
    setStep('success')
  }

  if (step === 'success' && success) {
    return (
      <div className="space-y-4 rounded-md bg-green-50 px-4 py-6 text-center">
        <p className="text-sm font-semibold text-green-900">Compte parent créé</p>
        <p className="text-xs text-green-800">
          {success.deliveryChannel === 'gmail'
            ? `Vos identifiants ont été envoyés à ${success.contactEmail}.`
            : `Vos identifiants seront envoyés par SMS au ${success.phonePrimary}.`}
        </p>
        <div className="rounded-lg border border-green-200 bg-white px-3 py-3 text-left text-sm">
          <p className="text-xs text-muted-foreground">Identifiant parent</p>
          <p className="font-mono text-base font-bold text-[#1B3A6B]">{success.parentCode}</p>
          {success.devPassword && (
            <>
              <p className="mt-2 text-xs text-muted-foreground">Mot de passe (dev uniquement)</p>
              <p className="font-mono text-sm font-semibold">{success.devPassword}</p>
            </>
          )}
        </div>
        <Button type="button" className="w-full" onClick={() => router.push('/login/parent')}>
          Se connecter
        </Button>
      </div>
    )
  }

  if (step === 'method') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Choisissez comment vérifier votre identité pour créer votre compte parent.
        </p>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => chooseMethod('phone')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-[#1B3A6B]/30 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B3A6B]/10">
              <Smartphone className="h-5 w-5 text-[#1B3A6B]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Numéro de téléphone</p>
              <p className="text-xs text-muted-foreground">Code par SMS</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => chooseMethod('gmail')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-[#1B3A6B]/30 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <Mail className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Compte Gmail</p>
              <p className="text-xs text-muted-foreground">Code à 6 chiffres par email</p>
            </div>
          </button>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login/parent" className="font-medium hover:text-foreground hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'otp-send') {
    return channel === 'phone' ? (
      <form onSubmit={phoneForm.handleSubmit(onSendPhone)} className="space-y-3">
        <button
          type="button"
          onClick={() => setStep('method')}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Changer de méthode
        </button>
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
            />
          </div>
          {phoneForm.formState.errors.phone && (
            <p className="text-xs text-destructive">{phoneForm.formState.errors.phone.message}</p>
          )}
        </div>
        {serverError && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={phoneForm.formState.isSubmitting}>
          {phoneForm.formState.isSubmitting ? 'Envoi…' : 'Recevoir le code SMS'}
        </Button>
      </form>
    ) : (
      <form onSubmit={gmailForm.handleSubmit(onSendGmail)} className="space-y-3">
        <button
          type="button"
          onClick={() => setStep('method')}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Changer de méthode
        </button>
        <div className="space-y-1">
          <Label htmlFor="email">Adresse Gmail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              {...gmailForm.register('email')}
              placeholder="prenom.nom@gmail.com"
              className="pl-8"
              autoComplete="email"
            />
          </div>
          {gmailForm.formState.errors.email && (
            <p className="text-xs text-destructive">{gmailForm.formState.errors.email.message}</p>
          )}
        </div>
        {serverError && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={gmailForm.formState.isSubmitting}>
          {gmailForm.formState.isSubmitting ? 'Envoi…' : 'Recevoir le code par Gmail'}
        </Button>
      </form>
    )
  }

  if (step === 'otp-verify') {
    return (
      <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-3">
        <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Code envoyé à <strong>{destination}</strong>
        </div>
        <div className="space-y-1">
          <Label htmlFor="code">Code de vérification</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="code"
              {...otpForm.register('code')}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              className="pl-8 tracking-widest"
            />
          </div>
          {otpForm.formState.errors.code && (
            <p className="text-xs text-destructive">{otpForm.formState.errors.code.message}</p>
          )}
        </div>
        {serverError && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={otpForm.formState.isSubmitting}>
          {otpForm.formState.isSubmitting ? 'Vérification…' : 'Valider le code'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={profileForm.handleSubmit(onCompleteProfile)} className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Complétez votre profil parent. Vos identifiants de connexion vous seront ensuite transmis
        {channel === 'gmail' ? ' par email.' : ' par SMS.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="firstName">Prénom</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="firstName" {...profileForm.register('firstName')} className="pl-8" placeholder="Prénom" />
          </div>
          {profileForm.formState.errors.firstName && (
            <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" {...profileForm.register('lastName')} placeholder="Nom" />
          {profileForm.formState.errors.lastName && (
            <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="dateOfBirth">Date de naissance</Label>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="dateOfBirth" type="date" {...profileForm.register('dateOfBirth')} className="pl-8" />
        </div>
        {profileForm.formState.errors.dateOfBirth && (
          <p className="text-xs text-destructive">{profileForm.formState.errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="phonePrimary">Téléphone principal</Label>
        <Input
          id="phonePrimary"
          {...profileForm.register('phonePrimary')}
          placeholder="+226 70 00 00 00"
          className={cn(channel === 'phone' && 'bg-slate-50')}
          readOnly={channel === 'phone'}
        />
        {profileForm.formState.errors.phonePrimary && (
          <p className="text-xs text-destructive">{profileForm.formState.errors.phonePrimary.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="phoneSecondary">Téléphone secondaire (optionnel)</Label>
        <Input id="phoneSecondary" {...profileForm.register('phoneSecondary')} placeholder="+226 76 00 00 00" />
      </div>

      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={profileForm.formState.isSubmitting}>
        {profileForm.formState.isSubmitting ? 'Création…' : 'Valider et recevoir mes identifiants'}
      </Button>
    </form>
  )
}
