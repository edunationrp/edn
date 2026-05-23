'use client'

import { useEffect, useState } from 'react'
import { getFounderRegistrationStatus } from '@/lib/actions/register-school'
import { DirectorAccountStep } from '@/features/auth/onboarding/director-account-step'
import { SchoolWizardStep } from '@/features/auth/onboarding/school-wizard-step'

const TOTAL_STEPS = 9

function GlobalProgress({ current }: { current: number }) {
  const percent = Math.round((current / TOTAL_STEPS) * 100)

  return (
    <div className="mb-4 shrink-0">
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Étape {current} sur {TOTAL_STEPS}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#1a4d2e] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function SchoolRegistrationWizard() {
  const [phase, setPhase] = useState<1 | 2>(1)
  const [globalStep, setGlobalStep] = useState(1)
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
        setPhase(2)
        setGlobalStep(3)
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
  }

  return (
    <div className="flex flex-col">
      <GlobalProgress current={globalStep} />

      {phase === 1 ? (
        <DirectorAccountStep
          onSubStepChange={setGlobalStep}
          onSuccess={name => {
            setDirectorName(name)
            setPhase(2)
            setGlobalStep(3)
          }}
        />
      ) : (
        <SchoolWizardStep
          directorName={directorName}
          defaultCountry={defaultCountry}
          onSubStepChange={step => setGlobalStep(2 + step)}
        />
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Déjà inscrit ?{' '}
        <a href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  )
}
