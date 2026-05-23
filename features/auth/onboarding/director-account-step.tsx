'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, Phone, User, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notify } from '@/lib/feedback/toast'
import { COUNTRIES } from '@/lib/onboarding/constants'
import { directorAccountSchema, type DirectorAccountValues } from '@/lib/onboarding/schemas'

type Props = {
  onComplete: (values: DirectorAccountValues) => void
  onSubStepChange?: (step: number) => void
}

export function DirectorAccountStep({ onComplete, onSubStepChange }: Props) {
  const [subStep, setSubStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<DirectorAccountValues>({
    resolver: zodResolver(directorAccountSchema),
    defaultValues: {
      country: 'BF',
      preferred_language: 'fr',
    },
  })

  useEffect(() => {
    onSubStepChange?.(subStep)
  }, [subStep, onSubStepChange])

  async function goToSecurityStep() {
    const valid = await trigger(['full_name', 'email', 'phone'])
    if (!valid) {
      notify.warning('Informations incomplètes', {
        description: 'Renseignez votre identité avant de continuer.',
      })
      return
    }
    setSubStep(2)
  }

  function onSubmit(values: DirectorAccountValues) {
    onComplete(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <div>
        {subStep === 1 ? (
          <div className="space-y-2.5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Votre identité</h2>
              <p className="text-[11px] text-muted-foreground">Compte directeur — contact</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="full_name" className="text-xs">
                Nom complet *
              </Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="full_name" placeholder="M. Jean KABORE" className="h-9 pl-8 text-sm" {...register('full_name')} />
              </div>
              {errors.full_name && <p className="text-[11px] text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="directeur@ecole.bf" className="h-9 pl-8 text-sm" {...register('email')} />
              </div>
              {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">
                Téléphone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" placeholder="+226 70 00 00 00" className="h-9 pl-8 text-sm" {...register('phone')} />
              </div>
              {errors.phone && <p className="text-[11px] text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Sécurité du compte</h2>
              <p className="text-[11px] text-muted-foreground">
                {getValues('full_name') ? `Compte de ${getValues('full_name')}` : 'Mot de passe et pays'}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="country" className="text-xs">
                Pays *
              </Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="country"
                  {...register('country')}
                  className="flex h-9 w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.country && <p className="text-[11px] text-destructive">{errors.country.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">
                Mot de passe *
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="h-9 pl-8 pr-9 text-sm"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm_password" className="text-xs">
                Confirmer le mot de passe *
              </Label>
              <Input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                className="h-9 text-sm"
                {...register('confirm_password')}
              />
              {errors.confirm_password && (
                <p className="text-[11px] text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        {subStep === 2 && (
          <Button type="button" variant="outline" size="sm" className="h-9 flex-1" onClick={() => setSubStep(1)}>
            Retour
          </Button>
        )}
        {subStep === 1 ? (
          <Button type="button" size="sm" className="h-9 flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]" onClick={goToSecurityStep}>
            Continuer
          </Button>
        ) : (
          <Button type="submit" size="sm" className="h-9 flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]">
            Continuer vers l&apos;école
          </Button>
        )}
      </div>
    </form>
  )
}
