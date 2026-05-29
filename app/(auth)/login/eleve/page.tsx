import Link from 'next/link'
import { Suspense } from 'react'
import { Bot } from 'lucide-react'
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
      <Link
        href="/tuteur"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#7AB832]/40 bg-[#7AB832]/10 px-4 py-3 text-sm font-medium text-[#1B3A6B] transition-colors hover:bg-[#7AB832]/15"
      >
        <Bot className="h-4 w-4 text-[#7AB832]" />
        Essayer EduBot sans connexion
      </Link>
    </div>
  )
}
