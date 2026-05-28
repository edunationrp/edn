import { Suspense } from 'react'
import { ParentRegistrationForm } from '@/features/auth/parent-registration-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription parent — EduNation',
}

export default function RegisterParentPage() {
  return (
    <div className="flex flex-col">
      <h2 className="mb-0.5 text-lg font-bold text-gray-900">Créer un compte parent</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Par téléphone (SMS) ou Gmail — vous recevrez ensuite votre identifiant E0… et un mot de passe
      </p>
      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Chargement…</div>}>
        <ParentRegistrationForm />
      </Suspense>
    </div>
  )
}
