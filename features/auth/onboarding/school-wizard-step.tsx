'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Settings2,
  Layers,
  Users,
  MapPin,
  Phone,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeSchoolOnboarding } from '@/lib/actions/register-school'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import {
  ACADEMIC_FORMATS,
  ACCESS_LEVELS,
  COUNTRIES,
  CURRENCIES,
  EVALUATION_SYSTEMS,
  getDefaultSchoolYearLabel,
  LANGUAGES,
  SCHOOL_TYPES,
  SUBSCRIPTION_PLANS,
} from '@/lib/onboarding/constants'
import {
  organizationSchema,
  schoolIdentitySchema,
  schoolSettingsSchema,
  schoolStructureSchema,
  type OnboardingSchoolPayload,
} from '@/lib/onboarding/schemas'

const SUB_STEPS = [
  { id: 1, label: 'Org.', icon: Users },
  { id: 2, label: 'École', icon: Building2 },
  { id: 3, label: 'Lieu', icon: MapPin },
  { id: 4, label: 'Contact', icon: Phone },
  { id: 5, label: 'Finance', icon: Settings2 },
  { id: 6, label: 'Pédago.', icon: GraduationCap },
  { id: 7, label: 'Structure', icon: Layers },
] as const

const TOTAL_SUB_STEPS = SUB_STEPS.length

type Props = {
  directorName: string
  defaultCountry?: string
  onSubStepChange?: (step: number) => void
}

type FormState = Partial<OnboardingSchoolPayload>

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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function SchoolWizardStep({ directorName, defaultCountry = 'BF', onSubStepChange }: Props) {
  const router = useRouter()
  const [subStep, setSubStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    organization_name: '',
    school_name: '',
    school_type: 'lycee',
    country: defaultCountry,
    city: '',
    address: '',
    phone: '',
    email: '',
    currency: 'XOF',
    school_year: getDefaultSchoolYearLabel(),
    evaluation_system: 'sur_20',
    main_language: 'fr',
    estimated_students: undefined,
    access_level: 'prive',
    structure_name: '',
    academic_format: 'trimestre',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const plan = SUBSCRIPTION_PLANS.starter

  useEffect(() => {
    onSubStepChange?.(subStep)
  }, [subStep, onSubStepChange])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'school_name' && !prev.structure_name) {
        next.structure_name = String(value)
      }
      return next
    })
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function validateCurrentSubStep() {
    let result

    switch (subStep) {
      case 1:
        result = organizationSchema.safeParse(form)
        break
      case 2:
        result = schoolIdentitySchema
          .pick({ school_name: true, school_type: true })
          .safeParse(form)
        break
      case 3:
        result = schoolIdentitySchema
          .pick({ country: true, city: true, address: true })
          .safeParse(form)
        break
      case 4:
        result = schoolIdentitySchema
          .pick({ phone: true, email: true })
          .safeParse({ phone: form.phone ?? '', email: form.email ?? '' })
        break
      case 5:
        result = schoolSettingsSchema
          .pick({ currency: true, school_year: true, evaluation_system: true })
          .safeParse(form)
        break
      case 6:
        result = schoolSettingsSchema
          .pick({ main_language: true, access_level: true, estimated_students: true })
          .safeParse(form)
        break
      default:
        result = schoolStructureSchema.safeParse({
          structure_name: form.structure_name || form.school_name,
          academic_format: form.academic_format,
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

    if (subStep === 5 && !form.structure_name && form.school_name) {
      setField('structure_name', form.school_name)
    }

    if (subStep < TOTAL_SUB_STEPS) {
      setSubStep(s => s + 1)
    }
  }

  function handleBack() {
    if (subStep > 1) setSubStep(s => s - 1)
  }

  async function handleFinish() {
    if (!validateCurrentSubStep()) return

    const payload: OnboardingSchoolPayload = {
      organization_name: form.organization_name!,
      school_name: form.school_name!,
      school_type: form.school_type!,
      country: form.country!,
      city: form.city!,
      address: form.address!,
      phone: form.phone,
      email: form.email,
      currency: form.currency!,
      school_year: form.school_year!,
      evaluation_system: form.evaluation_system!,
      main_language: form.main_language!,
      estimated_students: form.estimated_students,
      access_level: form.access_level!,
      structure_name: form.structure_name || form.school_name!,
      academic_format: form.academic_format!,
    }

    const checks = [
      organizationSchema.safeParse(payload),
      schoolIdentitySchema.safeParse(payload),
      schoolSettingsSchema.safeParse(payload),
      schoolStructureSchema.safeParse(payload),
    ]

    if (checks.some(c => !c.success)) {
      notify.warning('Informations incomplètes', {
        description: 'Certaines étapes nécessitent encore votre attention.',
      })
      return
    }

    setIsSubmitting(true)
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
    <div className="flex flex-col">
      <p className="mb-3 rounded-lg border border-[#1a4d2e]/15 bg-[#1a4d2e]/5 px-3 py-2 text-xs text-gray-700">
        Bienvenue{directorName ? `, ${directorName}` : ''} ! Étape {subStep}/{TOTAL_SUB_STEPS} — configuration
        de votre établissement principal.
      </p>

      <div className="mb-3 grid grid-cols-7 gap-1">
        {SUB_STEPS.map(s => (
          <div
            key={s.id}
            className={`rounded-md border px-1 py-1.5 text-center ${
              subStep === s.id
                ? 'border-[#1a4d2e] bg-[#1a4d2e]/5'
                : subStep > s.id
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
            }`}
          >
            <s.icon
              className={`mx-auto mb-0.5 h-3.5 w-3.5 ${subStep >= s.id ? 'text-[#1a4d2e]' : 'text-gray-400'}`}
            />
            <p className="text-[9px] font-medium leading-none">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        {subStep === 1 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Organisation</h3>
              <p className="text-xs text-muted-foreground">Nom du groupe scolaire</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nom du groupe / organisation *</Label>
              <Input
                placeholder="Groupe Scolaire Horizon"
                value={form.organization_name ?? ''}
                onChange={e => setField('organization_name', e.target.value)}
              />
              {errors.organization_name && (
                <p className="text-xs text-destructive">{errors.organization_name}</p>
              )}
            </div>
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Plan Starter</p>
              <p className="text-sm font-bold text-[#1a4d2e]">{plan.label} · jusqu&apos;à {plan.maxSchools} écoles</p>
            </div>
          </div>
        )}

        {subStep === 2 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Identité de l&apos;école</h3>
            </div>
            <div className="space-y-1.5">
              <Label>Nom de l&apos;école *</Label>
              <Input
                placeholder="Collège Saint-Jean"
                value={form.school_name ?? ''}
                onChange={e => setField('school_name', e.target.value)}
              />
              {errors.school_name && <p className="text-xs text-destructive">{errors.school_name}</p>}
            </div>
            <SelectField
              label="Type d'établissement *"
              value={form.school_type ?? 'lycee'}
              onChange={v => setField('school_type', v as FormState['school_type'])}
              options={SCHOOL_TYPES}
            />
          </div>
        )}

        {subStep === 3 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Localisation</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Pays *"
                value={form.country ?? 'BF'}
                onChange={v => setField('country', v)}
                options={COUNTRIES.map(c => ({ value: c.code, label: c.label }))}
                error={errors.country}
              />
              <div className="space-y-1.5">
                <Label>Ville *</Label>
                <Input
                  placeholder="Ouagadougou"
                  value={form.city ?? ''}
                  onChange={e => setField('city', e.target.value)}
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adresse complète *</Label>
              <Input
                placeholder="Secteur 15, Avenue de la Nation"
                value={form.address ?? ''}
                onChange={e => setField('address', e.target.value)}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>
          </div>
        )}

        {subStep === 4 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Contact école</h3>
              <p className="text-xs text-muted-foreground">Optionnel — modifiable plus tard</p>
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                placeholder="+226 25 00 00 00"
                value={form.phone ?? ''}
                onChange={e => setField('phone', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="contact@ecole.bf"
                value={form.email ?? ''}
                onChange={e => setField('email', e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>
        )}

        {subStep === 5 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Paramètres financiers</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Devise *"
                value={form.currency ?? 'XOF'}
                onChange={v => setField('currency', v)}
                options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))}
              />
              <div className="space-y-1.5">
                <Label>Année scolaire *</Label>
                <Input
                  placeholder="2025 — 2026"
                  value={form.school_year ?? ''}
                  onChange={e => setField('school_year', e.target.value)}
                />
                {errors.school_year && <p className="text-xs text-destructive">{errors.school_year}</p>}
              </div>
            </div>
            <SelectField
              label="Système d'évaluation *"
              value={form.evaluation_system ?? 'sur_20'}
              onChange={v => setField('evaluation_system', v as FormState['evaluation_system'])}
              options={EVALUATION_SYSTEMS}
            />
          </div>
        )}

        {subStep === 6 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Paramètres pédagogiques</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Langue principale *"
                value={form.main_language ?? 'fr'}
                onChange={v => setField('main_language', v)}
                options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
              />
              <SelectField
                label="Niveau d'accès *"
                value={form.access_level ?? 'prive'}
                onChange={v => setField('access_level', v as FormState['access_level'])}
                options={ACCESS_LEVELS}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre approximatif d&apos;élèves</Label>
              <Input
                type="number"
                min={0}
                placeholder="450"
                value={form.estimated_students ?? ''}
                onChange={e =>
                  setField('estimated_students', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </div>
        )}

        {subStep === 7 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Structure académique</h3>
            </div>
            <div className="space-y-1.5">
              <Label>Nom de la première structure *</Label>
              <Input
                placeholder={form.school_name || 'École principale'}
                value={form.structure_name ?? ''}
                onChange={e => setField('structure_name', e.target.value)}
              />
              {errors.structure_name && (
                <p className="text-xs text-destructive">{errors.structure_name}</p>
              )}
            </div>
            <SelectField
              label="Format académique *"
              value={form.academic_format ?? 'trimestre'}
              onChange={v => setField('academic_format', v as FormState['academic_format'])}
              options={ACADEMIC_FORMATS}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
        {subStep > 1 && (
          <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
            Retour
          </Button>
        )}
        {subStep < TOTAL_SUB_STEPS ? (
          <Button type="button" className="flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]" onClick={handleNext}>
            Continuer
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]"
            loading={isSubmitting}
            onClick={handleFinish}
          >
            Terminer
          </Button>
        )}
      </div>
    </div>
  )
}
