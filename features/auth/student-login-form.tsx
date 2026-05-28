'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { lookupStudentByIun, studentLogin } from '@/lib/actions/student-auth'
import Link from 'next/link'

const IUN_REGEX = /^BF-\d{4}-\d{6}-\d$/

const schema = z.object({
  iun: z.string().regex(IUN_REGEX, 'Format : BF-XXXX-XXXXXX-C'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type FormData = z.infer<typeof schema>

type Step = 'iun' | 'password'

export function StudentLoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('iun')
  const [studentName, setStudentName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { iun: '', password: '' },
  })

  async function onCheckIun() {
    setServerError('')
    const iun = getValues('iun').trim().toUpperCase()
    if (!IUN_REGEX.test(iun)) {
      setServerError('Format IUN invalide (BF-XXXX-XXXXXX-C)')
      return
    }

    const result = await lookupStudentByIun(iun)
    if ('error' in result) {
      setServerError(result.error ?? 'Une erreur est survenue.')
      return
    }

    const { student } = result
    if (!student.isActivated) {
      // Rediriger vers la page d'activation
      router.push(`/login/eleve/activation?iun=${encodeURIComponent(iun)}`)
      return
    }

    setStudentName(`${student.firstName} ${student.lastName}`)
    setStep('password')
  }

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = await studentLogin({
      iun: data.iun.trim().toUpperCase(),
      password: data.password,
    })

    if (result.error) {
      setServerError(result.error ?? 'Une erreur est survenue.')
      return
    }

    router.push('/eleve')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* IUN field */}
      <div className="space-y-1">
        <Label htmlFor="iun">Identifiant Unique National (IUN)</Label>
        <div className="relative">
          <GraduationCap className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="iun"
            {...register('iun')}
            placeholder="BF-2006-001234-5"
            className="pl-8 uppercase"
            autoComplete="username"
            readOnly={step === 'password'}
            onChange={e => {
              e.target.value = e.target.value.toUpperCase()
            }}
          />
        </div>
        {errors.iun && <p className="text-xs text-destructive">{errors.iun.message}</p>}
      </div>

      {step === 'iun' && (
        <Button
          type="button"
          className="w-full"
          onClick={onCheckIun}
          disabled={isSubmitting}
        >
          Continuer
        </Button>
      )}

      {step === 'password' && (
        <>
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Bienvenue, <strong>{studentName}</strong>
          </p>
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
                autoFocus
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </>
      )}

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/login/parent" className="hover:text-foreground hover:underline">
          Connexion parent
        </Link>
      </div>
    </form>
  )
}
