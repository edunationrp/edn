'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, IdCard, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginParent } from '@/lib/actions/parent-auth'
import Link from 'next/link'

const schema = z.object({
  parentCode: z
    .string()
    .min(12, 'Identifiant invalide')
    .regex(/^E0\d{10}$/i, 'Format : E0XXXXXXXXXX'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

export function ParentLoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = await loginParent({
      parentCode: data.parentCode.trim().toUpperCase(),
      password: data.password,
    })

    if (result.error) {
      setServerError(result.error)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="parentCode">Identifiant parent</Label>
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="parentCode"
            {...register('parentCode')}
            placeholder="E01551520251"
            className="pl-8 uppercase"
            autoComplete="username"
            onChange={e => {
              const value = e.target.value.toUpperCase().replace(/[^E0-9]/g, '')
              setValue('parentCode', value, { shouldValidate: true })
              e.target.value = value
            }}
          />
        </div>
        {errors.parentCode && (
          <p className="text-xs text-destructive">{errors.parentCode.message}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Reçu par email ou SMS lors de la création de votre compte.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Votre mot de passe"
            className="pl-8 pr-9"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>
      )}

      <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" disabled={isSubmitting}>
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </Button>

      <div className="space-y-2 border-t pt-3 text-center text-xs text-muted-foreground">
        <p>
          Pas encore de compte ?{' '}
          <Link href="/register/parent" className="font-medium hover:text-foreground hover:underline">
            Créer un compte parent
          </Link>
        </p>
        <Link href="/login" className="inline-block hover:text-foreground hover:underline">
          Connexion personnel / école
        </Link>
      </div>
    </form>
  )
}
