import { LoginForm } from '@/features/auth/login-form'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      <h2 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">Connexion</h2>
      <p className="mb-4 text-sm text-muted-foreground">Connectez-vous à votre espace EduNation</p>
      <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Chargement…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
