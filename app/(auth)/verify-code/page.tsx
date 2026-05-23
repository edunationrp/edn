import { VerifyCodeForm } from '@/features/auth/verify-code-form'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Vérification SMS',
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>}>
      <VerifyCodeForm />
    </Suspense>
  )
}
