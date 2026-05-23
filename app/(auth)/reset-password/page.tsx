import { ResetPasswordForm } from '@/features/auth/reset-password-form'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
