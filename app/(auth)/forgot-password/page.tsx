'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import Link from 'next/link'
import type { Metadata } from 'next'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      notify.error(error, 'auth_reset_password')
      return
    }

    notify.success(TOAST_SUCCESS.resetPasswordSent.title, {
      description: TOAST_SUCCESS.resetPasswordSent.description,
    })

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Email envoyé !</h2>
        <p className="text-muted-foreground text-sm">
          Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Mot de passe oublié</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" loading={isSubmitting}>
          Envoyer le lien
        </Button>
      </form>
    </>
  )
}
