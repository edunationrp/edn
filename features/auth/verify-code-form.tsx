'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/feedback/toast'
import Link from 'next/link'

const schema = z.object({
  code: z.string().min(4, 'Code requis').max(8, 'Code invalide'),
})

type FormData = z.infer<typeof schema>

export function VerifyCodeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const phone = searchParams.get('phone') ?? ''
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: data.code,
      type: 'sms',
    })

    if (error) {
      notify.error('Code incorrect ou expiré.', 'verify_code')
      return
    }

    notify.success('Numéro vérifié')
    router.push(redirect)
  }

  return (
    <>
      <Link href="/login" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour
      </Link>

      <div className="mb-3 flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a4d2e]/10">
          <ShieldCheck className="h-5 w-5 text-[#1a4d2e]" />
        </div>
      </div>

      <h2 className="mb-0.5 text-center text-lg font-bold text-gray-900">Vérification SMS</h2>
      <p className="mb-3 text-center text-xs text-muted-foreground">
        {phone
          ? `Entrez le code envoyé au ${phone}`
          : 'Entrez le code de vérification reçu par SMS'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="code">Code à 6 chiffres</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="text-center text-base tracking-[0.3em]"
            {...register('code')}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f]" loading={isSubmitting}>
          Vérifier
        </Button>
      </form>
    </>
  )
}
