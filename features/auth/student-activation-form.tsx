'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, KeyRound, Lock, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { activateStudentAccount } from '@/lib/actions/student-auth'
import Link from 'next/link'

const schema = z.object({
  iun: z.string().min(1, 'IUN requis'),
  code: z.string().length(6, '6 chiffres requis').regex(/^\d+$/, 'Chiffres uniquement'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(1, 'Confirmez le mot de passe'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function StudentActivationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultIun = searchParams.get('iun') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { iun: defaultIun, code: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = await activateStudentAccount({
      iun: data.iun.trim().toUpperCase(),
      code: data.code.trim(),
      password: data.password,
    })

    if (result.error) {
      setServerError(result.error)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login/eleve'), 2000)
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-green-800">Compte activé avec succès !</p>
        <p className="mt-1 text-xs text-green-700">Redirection vers la connexion…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="iun">IUN</Label>
        <div className="relative">
          <GraduationCap className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="iun"
            {...register('iun')}
            placeholder="BF-2006-001234-5"
            className="pl-8 uppercase"
          />
        </div>
        {errors.iun && <p className="text-xs text-destructive">{errors.iun.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="code">Code d'activation (remis par le secrétariat)</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="code"
            {...register('code')}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="pl-8 tracking-widest"
          />
        </div>
        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Minimum 8 caractères"
            className="pl-8 pr-9"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          placeholder="Répétez le mot de passe"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Activation…' : 'Activer mon compte'}
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        <Link href="/login/eleve" className="hover:text-foreground hover:underline">
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  )
}
