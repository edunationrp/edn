'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getFounderRegistrationStatus } from '@/lib/actions/register-school'
import { DirectorAccountStep } from '@/features/auth/onboarding/director-account-step'
import { SchoolWizardStep } from '@/features/auth/onboarding/school-wizard-step'

function MainStepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Compte directeur' },
    { n: 2, label: 'Création école' },
  ]

  return (
    <div className="flex items-center gap-3 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.n ? 'bg-[#1a4d2e] text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 rounded ${step > s.n ? 'bg-[#1a4d2e]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function SchoolRegistrationWizard() {
  const [step, setStep] = useState<1 | 2>(1)
  const [directorName, setDirectorName] = useState('')
  const [defaultCountry, setDefaultCountry] = useState('BF')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const status = await getFounderRegistrationStatus()

      if (status.authenticated) {
        setDirectorName(status.fullName)
        setDefaultCountry(status.country)
        if (status.hasSchools) {
          window.location.href = '/dashboard'
          return
        }
        setStep(2)
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Chargement…
      </div>
    )
  }

  return (
    <div>
      <MainStepIndicator step={step} />

      {step === 1 ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Étape 1 — Compte directeur</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Création rapide du compte lié à votre ou vos établissements.
          </p>
          <DirectorAccountStep
            onSuccess={name => {
              setDirectorName(name)
              setStep(2)
            }}
          />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Étape 2 — Création de l&apos;école</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Wizard pas à pas : organisation, école, paramètres et structure académique.
          </p>
          <SchoolWizardStep directorName={directorName} defaultCountry={defaultCountry} />
        </>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        Déjà inscrit ?{' '}
        <a href="/login" className="text-primary hover:underline font-medium">
          Se connecter
        </a>
      </p>
    </div>
  )
}
