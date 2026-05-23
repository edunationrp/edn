import Link from 'next/link'
import { Phone, PhoneOff, GraduationCap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription élève — EduNation',
  description: 'Inscrivez votre enfant dans un établissement scolaire partenaire EduNation.',
}

export default function RegisterStudentPage() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a4d2e]/10">
          <GraduationCap className="h-5 w-5 text-[#1a4d2e]" />
        </div>
        <h1 className="text-base font-bold text-gray-900">Inscription élève</h1>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Choisissez le parcours adapté à la situation de l&apos;élève
        </p>
      </div>

      <div className="space-y-2">
        <Link
          href="/register/student/with-phone"
          className="flex items-start gap-2.5 rounded-lg border p-3 transition hover:border-[#1a4d2e]/40 hover:bg-[#1a4d2e]/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
            <Phone className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <p className="text-sm font-semibold">Avec téléphone personnel</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              L&apos;élève possède son propre numéro. Notifications SMS directes.
            </p>
          </div>
        </Link>

        <Link
          href="/register/student/without-phone"
          className="flex items-start gap-2.5 rounded-lg border p-3 transition hover:border-[#1a4d2e]/40 hover:bg-[#1a4d2e]/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <PhoneOff className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold">Sans téléphone personnel</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Notifications via le parent ou interface simplifiée à l&apos;établissement.
            </p>
          </div>
        </Link>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-[#1a4d2e] hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
