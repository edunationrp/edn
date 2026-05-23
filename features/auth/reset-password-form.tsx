'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/feedback/toast'
import Link from 'next/link'

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  const code = searchParams.get('code')
  const type = searchParams.get('type')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (type === 'recovery' && code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        notify.error('Lien expiré ou invalide. Demandez un nouveau lien.', 'auth_reset')
        return
      }
    }

    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      notify.error(error, 'auth_reset')
      return
    }

    setDone(true)
    notify.success('Mot de passe mis à jour')
    setTimeout(() => router.push('/login'), 2000)
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="text-lg font-bold">Mot de passe modifié</h2>
        <p className="text-xs text-muted-foreground">Redirection vers la connexion…</p>
        <Button asChild className="bg-[#1a4d2e] hover:bg-[#2d6a4f]">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-0.5 text-lg font-bold text-gray-900">Nouveau mot de passe</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Choisissez un mot de passe sécurisé pour votre compte EduNation.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="pl-9 pr-10"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" loading={isSubmitting}>
          Enregistrer le mot de passe
        </Button>
      </form>
    </>
  )
}
