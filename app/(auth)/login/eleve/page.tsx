import { Suspense } from 'react'
import { StudentLoginForm } from '@/features/auth/student-login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion Élève — EduNation',
}

export default function StudentLoginPage() {
  return (
    <div className="flex flex-col">
      <h2 className="mb-0.5 text-lg font-bold text-gray-900">Espace Élève</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Entrez votre IUN pour accéder à votre espace
      </p>
      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Chargement…</div>}>
        <StudentLoginForm />
      </Suspense>
    </div>
  )
}
