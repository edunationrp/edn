'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeFullRegistration, completeSchoolOnboarding } from '@/lib/actions/register-school'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import { buildOnboardingSchoolPayload, COUNTRIES, SCHOOL_TYPES } from '@/lib/onboarding/constants'
import type { DirectorAccountValues, SchoolWizardValues } from '@/lib/onboarding/schemas'
import { schoolWizardSchema } from '@/lib/onboarding/schemas'

const SUB_STEPS = [
  { id: 1, label: 'École', icon: Building2 },
  { id: 2, label: 'Lieu', icon: MapPin },
  { id: 3, label: 'Contact', icon: Phone },
] as const

const TOTAL_SUB_STEPS = SUB_STEPS.length

type Props = {
  directorName: string
  defaultCountry?: string
  directorAccount?: DirectorAccountValues
  initialForm?: FormState
  initialSubStep?: number
  onSubStepChange?: (step: number) => void
  onRegistrationComplete?: (email: string) => void
  onEditDirector?: (draft: { form: FormState; subStep: number }) => void
}

type FormState = Partial<SchoolWizardValues>

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
  error?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

export function SchoolWizardStep({
  directorName,
  defaultCountry = 'BF',
  directorAccount,
  initialForm,
  initialSubStep = 1,
  onSubStepChange,
  onRegistrationComplete,
  onEditDirector,
}: Props) {
  const router = useRouter()
  const [subStep, setSubStep] = useState(initialSubStep)
  const [form, setForm] = useState<FormState>(
    initialForm ?? {
      school_name: '',
      school_type: 'lycee',
      country: defaultCountry,
      city: '',
      address: '',
      phone: '',
      email: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    onSubStepChange?.(subStep)
  }, [subStep, onSubStepChange])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function validateCurrentSubStep() {
    let result

    switch (subStep) {
      case 1:
        result = schoolWizardSchema.pick({ school_name: true, school_type: true }).safeParse(form)
        break
      case 2:
        result = schoolWizardSchema.pick({ country: true, city: true, address: true }).safeParse(form)
        break
      default:
        result = schoolWizardSchema.pick({ phone: true, email: true }).safeParse({
          phone: form.phone ?? '',
          email: form.email ?? '',
        })
    }

    if (result.success) {
      setErrors({})
      return true
    }

    const fieldErrors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      fieldErrors[String(issue.path[0])] = issue.message
    })
    setErrors(fieldErrors)
    return false
  }

  function handleNext() {
    if (!validateCurrentSubStep()) {
      notify.warning('Informations incomplètes', {
        description: 'Vérifiez les champs obligatoires avant de continuer.',
      })
      return
    }

    if (subStep < TOTAL_SUB_STEPS) {
      setSubStep(s => s + 1)
    }
  }

  function handleBack() {
    if (subStep > 1) setSubStep(s => s - 1)
  }

  function saveDraftAndEditDirector() {
    onEditDirector?.({ form, subStep })
  }

  async function handleFinish() {
    if (!validateCurrentSubStep()) return

    const wizardCheck = schoolWizardSchema.safeParse(form)
    if (!wizardCheck.success) {
      notify.warning('Informations incomplètes', {
        description: 'Certaines étapes nécessitent encore votre attention.',
      })
      return
    }

    const payload = buildOnboardingSchoolPayload(wizardCheck.data, {
      preferredLanguage: directorAccount?.preferred_language,
    })

    setIsSubmitting(true)

    if (directorAccount) {
      const { confirm_password: _, ...director } = directorAccount
      const result = await completeFullRegistration(director, payload, {
        appOrigin: window.location.origin,
      })
      setIsSubmitting(false)

      if (result.error) {
        if ('code' in result && result.code === 'EMAIL_ALREADY_EXISTS') {
          onEditDirector?.({ form, subStep })
          notify.warning('Email déjà utilisé', {
            description: 'Modifiez votre email directeur. Les informations de l\'école sont conservées.',
          })
          return
        }
        notify.error(result.error, 'onboarding_school')
        return
      }

      notify.success('Inscription terminée', {
        description: 'Consultez votre email pour confirmer votre compte.',
      })
      onRegistrationComplete?.(result.email ?? directorAccount.email)
      return
    }

    const result = await completeSchoolOnboarding(payload)
    setIsSubmitting(false)

    if (result.error) {
      notify.error(result.error, 'onboarding_school')
      return
    }

    notify.success(TOAST_SUCCESS.onboardingComplete.title, {
      description: TOAST_SUCCESS.onboardingComplete.description,
    })

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="text-sm">
      <p className="mb-2 rounded-md border border-[#1a4d2e]/15 bg-[#1a4d2e]/5 px-2.5 py-1.5 text-[11px] leading-snug text-gray-700">
        Bienvenue{directorName ? `, ${directorName}` : ''} ! École — {subStep}/{TOTAL_SUB_STEPS}
        {directorAccount && onEditDirector && (
          <>
            {' '}
            ·{' '}
            <button
              type="button"
              onClick={saveDraftAndEditDirector}
              className="font-medium text-[#1a4d2e] underline-offset-2 hover:underline"
            >
              Modifier mon email
            </button>
          </>
        )}
      </p>

      <div className="mb-2.5 flex items-center gap-1 overflow-x-auto pb-0.5">
        {SUB_STEPS.map(s => (
          <div
            key={s.id}
            title={s.label}
            className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 ${
              subStep === s.id
                ? 'border-[#1a4d2e] bg-[#1a4d2e]/5'
                : subStep > s.id
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
            }`}
          >
            <s.icon
              className={`h-3 w-3 ${subStep >= s.id ? 'text-[#1a4d2e]' : 'text-gray-400'}`}
            />
            <span className="text-[9px] font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      <div>
        {subStep === 1 && (
          <div className="space-y-2.5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Identité de l&apos;école</h3>
              <p className="text-[11px] text-muted-foreground">
                Les paramètres avancés pourront être configurés plus tard.
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nom de l&apos;école *</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Collège Saint-Jean"
                value={form.school_name ?? ''}
                onChange={e => setField('school_name', e.target.value)}
              />
              {errors.school_name && <p className="text-[11px] text-destructive">{errors.school_name}</p>}
            </div>
            <SelectField
              label="Type d'établissement *"
              value={form.school_type ?? 'lycee'}
              onChange={v => setField('school_type', v as FormState['school_type'])}
              options={SCHOOL_TYPES}
            />
          </div>
        )}

        {subStep === 2 && (
          <div className="space-y-2.5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Localisation</h3>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <SelectField
                label="Pays *"
                value={form.country ?? 'BF'}
                onChange={v => setField('country', v)}
                options={COUNTRIES.map(c => ({ value: c.code, label: c.label }))}
                error={errors.country}
              />
              <div className="space-y-1">
                <Label className="text-xs">Ville *</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="Ouagadougou"
                  value={form.city ?? ''}
                  onChange={e => setField('city', e.target.value)}
                />
                {errors.city && <p className="text-[11px] text-destructive">{errors.city}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Adresse complète *</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Secteur 15, Avenue de la Nation"
                value={form.address ?? ''}
                onChange={e => setField('address', e.target.value)}
              />
              {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
            </div>
          </div>
        )}

        {subStep === 3 && (
          <div className="space-y-2.5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Contact école</h3>
              <p className="text-[11px] text-muted-foreground">Optionnel — modifiable plus tard</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Téléphone</Label>
              <Input
                className="h-9 text-sm"
                placeholder="+226 25 00 00 00"
                value={form.phone ?? ''}
                onChange={e => setField('phone', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                className="h-9 text-sm"
                type="email"
                placeholder="contact@ecole.bf"
                value={form.email ?? ''}
                onChange={e => setField('email', e.target.value)}
              />
              {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        {subStep > 1 && (
          <Button type="button" variant="outline" size="sm" className="h-9 flex-1" onClick={handleBack}>
            Retour
          </Button>
        )}
        {subStep < TOTAL_SUB_STEPS ? (
          <Button type="button" size="sm" className="h-9 flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]" onClick={handleNext}>
            Continuer
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]"
            loading={isSubmitting}
            onClick={handleFinish}
          >
            Terminer l&apos;inscription
          </Button>
        )}
      </div>
    </div>
  )
}
