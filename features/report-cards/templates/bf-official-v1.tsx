'use client'

import Image from 'next/image'
import { cn, formatDate } from '@/lib/utils'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

type Props = {
  snapshot: BulletinSnapshot
  className?: string
  showActions?: boolean
  onPrint?: () => void
  onDownload?: () => void
  onSendParents?: () => void
  actionsPending?: boolean
}

function gradeTone(value: number | null) {
  if (value === null) return 'text-slate-400'
  if (value < 10) return 'text-red-600 font-bold'
  if (value >= 14) return 'text-emerald-700 font-bold'
  return 'text-slate-900 font-semibold'
}

export function BfOfficialV1Bulletin({
  snapshot,
  className,
  showActions = false,
  onPrint,
  onDownload,
  onSendParents,
  actionsPending,
}: Props) {
  const rankLabel = (rank: number | null, size: number) => {
    if (rank === null) return '—'
    return `${rank}${rank === 1 ? 'er' : 'ème'}`
  }

  return (
    <div className={cn('space-y-4', className)}>
      <article
        id="bulletin-print"
        className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none print:p-4"
      >
        {/* En-tête */}
        <header className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4">
          <div className="text-[10px] leading-relaxed text-slate-700">
            <p className="font-bold uppercase">Ministère de l&apos;Éducation Nationale</p>
            <p className="font-semibold">Burkina Faso</p>
            <p className="italic text-slate-500">{snapshot.school.motto}</p>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            {snapshot.school.logoUrl ? (
              <div className="relative mb-2 h-16 w-16">
                <Image
                  src={snapshot.school.logoUrl}
                  alt={snapshot.school.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
                Logo
              </div>
            )}
            <p className="text-sm font-bold uppercase tracking-wide text-[#1B3A6B]">
              {snapshot.school.name}
            </p>
            {snapshot.school.structureName && (
              <p className="text-[10px] text-muted-foreground">{snapshot.school.structureName}</p>
            )}
          </div>

          <div className="flex flex-col items-end justify-start">
            <div className="rounded-md border-2 border-[#1B3A6B] px-4 py-2 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
                Bulletin de notes
              </p>
              <p className="mt-1 text-[10px] text-slate-600">Année scolaire {snapshot.schoolYear}</p>
              <p className="text-[10px] font-semibold text-slate-800">{snapshot.termLabel}</p>
            </div>
          </div>
        </header>

        {/* Identité élève */}
        <section className="mt-4 grid grid-cols-[96px_1fr] gap-4 rounded-lg border border-slate-200 p-4">
          <div className="relative h-28 w-24 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            {snapshot.student.photoUrl ? (
              <Image
                src={snapshot.student.photoUrl}
                alt={`${snapshot.student.lastName} ${snapshot.student.firstName}`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                Photo
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Nom & Prénom(s)</p>
              <p className="font-bold uppercase">
                {snapshot.student.lastName} {snapshot.student.firstName}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Matricule</p>
              <p className="font-medium">{snapshot.student.matricule}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Classe</p>
              <p className="font-medium">{snapshot.student.className}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Effectif</p>
              <p className="font-medium">{snapshot.student.classSize}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Né(e) le</p>
              <p className="font-medium">
                {formatDate(snapshot.student.birthDate)}
                {snapshot.student.birthPlace && ` à ${snapshot.student.birthPlace}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Prof. principal</p>
              <p className="font-medium">{snapshot.student.headTeacherName ?? '—'}</p>
            </div>
          </div>
        </section>

        {/* Tableau des notes */}
        <section className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-sky-100/80 text-left text-[11px] uppercase tracking-wide text-slate-700">
                <th className="px-3 py-2.5 font-semibold">Matières</th>
                <th className="px-3 py-2.5 text-center font-semibold">Coef</th>
                <th className="px-3 py-2.5 text-center font-semibold">Devoir 1</th>
                <th className="px-3 py-2.5 text-center font-semibold">Devoir 2</th>
                <th className="px-3 py-2.5 text-center font-semibold">Examen</th>
                <th className="px-3 py-2.5 text-center font-semibold">Moy. Classe</th>
                <th className="px-3 py-2.5 text-center font-semibold">Moy. Élève</th>
                <th className="px-3 py-2.5 text-center font-semibold">Rang</th>
                <th className="px-3 py-2.5 font-semibold">Appréciations du Professeur</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.subjects.map((subject, index) => (
                <tr
                  key={subject.subjectId}
                  className={cn('border-t border-slate-100', index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}
                >
                  <td className="px-3 py-2 font-medium">{subject.name}</td>
                  <td className="px-3 py-2 text-center">{subject.coefficient}</td>
                  <td className={cn('px-3 py-2 text-center tabular-nums', gradeTone(subject.devoir1 ?? null))}>
                    {subject.devoir1?.toFixed(2) ?? '—'}
                  </td>
                  <td className={cn('px-3 py-2 text-center tabular-nums', gradeTone(subject.devoir2 ?? null))}>
                    {subject.devoir2?.toFixed(2) ?? '—'}
                  </td>
                  <td className={cn('px-3 py-2 text-center tabular-nums', gradeTone(subject.examen ?? null))}>
                    {subject.examen?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {subject.classAverage?.toFixed(2) ?? '—'}
                  </td>
                  <td className={cn('px-3 py-2 text-center tabular-nums', gradeTone(subject.studentAverage))}>
                    {subject.studentAverage?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-center">{rankLabel(subject.rank, snapshot.student.classSize)}</td>
                  <td className="px-3 py-2 text-slate-700">{subject.appreciation}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#1B3A6B] text-white">
                <td colSpan={6} className="px-3 py-3 text-sm font-bold uppercase">
                  Moyenne générale
                </td>
                <td className="px-3 py-3 text-center text-lg font-bold tabular-nums">
                  {snapshot.generalAverage?.toFixed(2) ?? '—'}
                </td>
                <td colSpan={2} className="px-3 py-3 text-sm font-semibold">
                  Rang : {rankLabel(snapshot.generalRank, snapshot.student.classSize)} / {snapshot.student.classSize}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Retraits de points */}
        {snapshot.conduct.deductions.length > 0 && (
          <section className="mt-4 rounded-lg border border-red-100 bg-red-50/40 p-4">
            <h3 className="mb-2 text-sm font-bold uppercase text-red-900">Retraits de points</h3>
            <p className="mb-2 text-xs text-red-800">
              Total : <span className="font-bold">−{snapshot.conduct.totalPointsDeducted.toFixed(2)} points</span>
            </p>
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-red-100 text-left text-red-800">
                  <th className="py-1.5 pr-3 font-semibold">Date</th>
                  <th className="py-1.5 pr-3 font-semibold">Points</th>
                  <th className="py-1.5 font-semibold">Motif</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.conduct.deductions.map(item => (
                  <tr key={item.id} className="border-b border-red-50">
                    <td className="py-1.5 pr-3">{formatDate(item.date)}</td>
                    <td className="py-1.5 pr-3 font-semibold text-red-700">−{item.points}</td>
                    <td className="py-1.5">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Bas de page */}
        <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="text-xs font-bold uppercase text-slate-700">Bilan des absences</h3>
            <p className="mt-2 text-sm">
              Heures manquées : <span className="font-semibold">{snapshot.absences.totalHours}h</span>
            </p>
            <p className="text-sm">
              Non justifiées : <span className="font-semibold">{snapshot.absences.unjustifiedHours}h</span>
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="text-xs font-bold uppercase text-slate-700">Décision du conseil</h3>
            <p className="mt-2 text-sm font-semibold text-[#1B3A6B]">
              {snapshot.councilDecision ?? snapshot.generalAppreciation}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{snapshot.generalAppreciation}</p>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="text-xs font-bold uppercase text-slate-700">{snapshot.proviseurSignatureLabel}</h3>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                Signé
              </span>
              <span className="text-xs text-muted-foreground">
                {snapshot.school.city ?? 'Ouagadougou'},{' '}
                {snapshot.signedAt ? formatDate(snapshot.signedAt) : formatDate(snapshot.generatedAt)}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground font-mono">
              Auth. {snapshot.qrHash.slice(0, 16)}…
            </p>
          </div>
        </section>
      </article>

      {showActions && (
        <div className="flex flex-wrap justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={onPrint ?? (() => window.print())}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Imprimer
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={actionsPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Télécharger PDF
          </button>
          {onSendParents && (
            <button
              type="button"
              onClick={onSendParents}
              disabled={actionsPending}
              className="rounded-lg bg-[#8B6914] px-4 py-2 text-sm font-medium text-white hover:bg-[#735610] disabled:opacity-50"
            >
              Envoyer aux parents
            </button>
          )}
        </div>
      )}
    </div>
  )
}
