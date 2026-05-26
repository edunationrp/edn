'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export type GuichetNoticeVariant = 'refused' | 'returned'

type Props = {
  trackingRef: string
  studentName: string
  className: string | null
  variant: GuichetNoticeVariant
  reason: string
  schoolName?: string
  decidedAt?: string | null
  parentPhone?: string | null
}

const VARIANT_COPY: Record<
  GuichetNoticeVariant,
  { title: string; subtitle: string; footer: string }
> = {
  refused: {
    title: 'Avis de non-admission',
    subtitle: 'Décision définitive de la direction',
    footer:
      'Ce document atteste du refus d\'admission. Conservez-le pour vos démarches. Pour toute question, présentez cette référence au guichet.',
  },
  returned: {
    title: 'Avis de dossier incomplet',
    subtitle: 'Corrections demandées par la direction',
    footer:
      'Veuillez compléter ou corriger les éléments indiqués puis repasser au secrétariat avec les pièces demandées.',
  },
}

export function AdmissionGuichetNotice({
  trackingRef,
  studentName,
  className,
  variant,
  reason,
  schoolName = 'Établissement scolaire',
  decidedAt,
  parentPhone,
}: Props) {
  const copy = VARIANT_COPY[variant]
  const dateLabel = decidedAt ? formatDate(decidedAt) : formatDate(new Date().toISOString())

  function handlePrint() {
    window.print()
  }

  return (
    <div className="admission-guichet-notice">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-slate-600">
          Document à remettre au parent au guichet (impression A4).
        </p>
        <Button type="button" size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimer l&apos;avis
        </Button>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none print:p-0">
        <header className="border-b border-slate-200 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {schoolName}
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">{copy.title}</h2>
          <p className="text-sm text-slate-600">{copy.subtitle}</p>
        </header>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Référence dossier</dt>
            <dd className="font-mono font-semibold text-slate-900">{trackingRef}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Date</dt>
            <dd className="text-slate-900">{dateLabel}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-slate-500">Enfant concerné</dt>
            <dd className="font-semibold text-slate-900">{studentName}</dd>
          </div>
          {className && (
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Classe demandée</dt>
              <dd className="text-slate-900">{className}</dd>
            </div>
          )}
          {parentPhone && (
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Contact parent</dt>
              <dd className="text-slate-900">{parentPhone}</dd>
            </div>
          )}
        </dl>

        <section className="mt-6 rounded-md border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {variant === 'refused' ? 'Motif du refus' : 'Corrections attendues'}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {reason}
          </p>
        </section>

        <footer className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-600">
          {copy.footer}
        </footer>

        <p className="mt-6 text-center text-[10px] text-slate-400 print:mt-8">
          EduNation — Document généré le {dateLabel}
        </p>
      </article>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .admission-guichet-notice,
          .admission-guichet-notice * {
            visibility: visible;
          }
          .admission-guichet-notice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
