import { Suspense } from 'react'
import { StudentActivationForm } from '@/features/auth/student-activation-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activation compte élève — EduNation',
}

export default function StudentActivationPage() {
  return (
    <div className="flex flex-col">
      <h2 className="mb-0.5 text-lg font-bold text-gray-900">Première connexion</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Entrez le code remis par le secrétariat et créez votre mot de passe
      </p>
      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Chargement…</div>}>
        <StudentActivationForm />
      </Suspense>
    </div>
  )
}
