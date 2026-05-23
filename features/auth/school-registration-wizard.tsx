'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getFounderRegistrationStatus } from '@/lib/actions/register-school'
import { DirectorAccountStep } from '@/features/auth/onboarding/director-account-step'
import { SchoolWizardStep } from '@/features/auth/onboarding/school-wizard-step'
import type { DirectorAccountValues } from '@/lib/onboarding/schemas'

const TOTAL_STEPS = 5

function GlobalProgress({ current }: { current: number }) {
  const percent = Math.round((current / TOTAL_STEPS) * 100)

  return (
    <div className="text-sm">
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            Étape {current} sur {TOTAL_STEPS}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#1a4d2e] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function RegistrationCompleteScreen({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center space-y-3 py-1 text-center text-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Mail className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-gray-900">Inscription terminée !</h3>
      <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
        Votre compte directeur et votre établissement ont été créés. Un email de confirmation a été
        envoyé à <strong className="text-gray-800">{email}</strong>. Cliquez sur le lien pour
        activer votre compte, puis connectez-vous.
      </p>
      <Button asChild size="sm" className="h-9 bg-[#1a4d2e] hover:bg-[#2d6a4f]">
        <a href="/login">Aller à la connexion</a>
      </Button>
    </div>
  )
}

export function SchoolRegistrationWizard() {
  const [phase, setPhase] = useState<1 | 2>(1)
  const [globalStep, setGlobalStep] = useState(1)
  const [directorAccount, setDirectorAccount] = useState<DirectorAccountValues | null>(null)
  const [directorName, setDirectorName] = useState('')
  const [defaultCountry, setDefaultCountry] = useState('BF')
  const [completedEmail, setCompletedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [legacyAuthenticated, setLegacyAuthenticated] = useState(false)

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
        setLegacyAuthenticated(true)
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

  if (completedEmail) {
    return <RegistrationCompleteScreen email={completedEmail} />
  }

  return (
    <div className="flex flex-col">
      <GlobalProgress current={globalStep} />

      {phase === 1 ? (
        <DirectorAccountStep
          onSubStepChange={setGlobalStep}
          onComplete={values => {
            setDirectorAccount(values)
            setDirectorName(values.full_name)
            setDefaultCountry(values.country)
            setPhase(2)
            setGlobalStep(3)
          }}
        />
      ) : (
        <SchoolWizardStep
          directorName={directorName}
          defaultCountry={defaultCountry}
          directorAccount={legacyAuthenticated ? undefined : directorAccount ?? undefined}
          onSubStepChange={step => setGlobalStep(2 + step)}
          onRegistrationComplete={email => setCompletedEmail(email)}
        />
      )}

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Déjà inscrit ?{' '}
        <a href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  )
}
