'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { registerStaffFromInvitation } from '@/lib/actions/staff'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/feedback/toast'
import { ROLE_COLORS } from '@/types/roles'
import type { UserRole } from '@/types/roles'

const schema = z.object({
  fullName: z.string().min(3, 'Nom complet requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

type JoinStaffSignupClientProps = {
  token: string
  preview: {
    schoolName: string
    roleCode: string
    roleLabel: string
    invitedName: string | null
    invitedEmail: string | null
    isValid: boolean
    isExpired: boolean
    status: string
  } | null
  error?: string
}

export function JoinStaffSignupClient({ token, preview, error }: JoinStaffSignupClientProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: preview?.invitedName ?? '',
      email: preview?.invitedEmail ?? '',
    },
  })

  if (error || !preview || !preview.isValid || preview.isExpired || preview.status !== 'pending') {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error ?? 'Cette invitation n\'est plus valide.'}
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/join/staff/${token}`}>Retour</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card className="border-green-100">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <CheckCircle className="mb-3 h-12 w-12 text-green-600" />
          <h2 className="text-lg font-semibold">Compte créé</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous pouvez maintenant accéder à {preview.schoolName}.
          </p>
          <Button asChild className="mt-4 bg-[#1a4d2e] hover:bg-[#2d6a4f]">
            <Link href="/dashboard">Accéder au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await registerStaffFromInvitation({
        token,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      })

      if ('error' in result && result.error) {
        notify.error(result.error, 'staff_signup')
        return
      }

      const supabase = createClient()
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      setDone(true)
      notify.success('Compte créé avec succès')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a4d2e]/10">
          <UserPlus className="h-6 w-6 text-[#1a4d2e]" />
        </div>
        <CardTitle>Créer votre compte</CardTitle>
        <CardDescription>
          Rejoignez <strong>{preview.schoolName}</strong>
        </CardDescription>
        <Badge className={`mx-auto mt-2 ${ROLE_COLORS[preview.roleCode as UserRole] ?? ''}`}>
          {preview.roleLabel}
        </Badge>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" readOnly={!!preview.invitedEmail} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input id="phone" placeholder="+226 70 00 00 00" {...register('phone')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} />
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
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer mon compte'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(`/join/staff/${token}`)}`} className="text-[#1a4d2e] hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
