import { LoginForm } from '@/features/auth/login-form'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      <h2 className="mb-0.5 text-lg font-bold text-gray-900">Connexion</h2>
      <p className="mb-3 text-xs text-muted-foreground">Connectez-vous à votre espace EduNation</p>
      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Chargement…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
