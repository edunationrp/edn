import { LoginForm } from '@/features/auth/login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default function LoginPage() {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Connectez-vous à votre espace EduNation
      </p>
      <LoginForm />
    </>
  )
}
