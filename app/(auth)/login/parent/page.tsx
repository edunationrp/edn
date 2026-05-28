import { Suspense } from 'react'
import { ParentLoginForm } from '@/features/auth/parent-login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion parent — EduNation',
}

export default function ParentLoginPage() {
  return (
    <div className="flex flex-col">
      <h2 className="mb-0.5 text-lg font-bold text-gray-900">Espace parent</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Connectez-vous avec votre identifiant E0… et le mot de passe reçu par email ou SMS
      </p>
      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Chargement…</div>}>
        <ParentLoginForm />
      </Suspense>
    </div>
  )
}
