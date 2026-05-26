import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import {
  canAccessAdmissionArchives,
  canAccessProviseurAdmissionValidation,
  canAccessSecretaryAdmissionQueue,
} from '@/lib/admissions/access'
import { getAdmissionRequest } from '@/lib/admissions/queries'
import { parseDossierMetadata } from '@/lib/admissions/dossier-metadata'
import { formatAdmissionTrackingRef } from '@/lib/admissions/format'
import { PageHeader } from '@/components/dashboard/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdmissionDossierForm } from '@/features/admissions/admission-dossier-form'
import { AdmissionSecretaryActions } from '@/features/admissions/admission-secretary-actions'
import { AdmissionDecisionActions } from '@/features/admissions/admission-decision-actions'
import { AdmissionGuichetNotice } from '@/features/admissions/admission-guichet-notice'
import { WORKFLOW_STATUS_LABELS } from '@/lib/admissions/workflow'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dossier admission',
}

export default async function AdmissionDossierPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const isSecretary = canAccessSecretaryAdmissionQueue(ctx.role_code)
  const isProviseur = canAccessProviseurAdmissionValidation(ctx.role_code)
  const canViewArchives = canAccessAdmissionArchives(ctx.role_code)
  if (!isSecretary && !isProviseur) redirect('/dashboard')

  const dossier = await getAdmissionRequest(ctx.school_id, requestId)
  if (!dossier) notFound()

  const isRejected = dossier.requestStatus === 'rejected'
  if (isRejected && !canViewArchives) notFound()

  const { data: requestRaw } = await supabase
    .from('student_registration_requests')
    .select('metadata')
    .eq('id', requestId)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const meta = parseDossierMetadata(
    (requestRaw as Array<{ metadata: Record<string, unknown> | null }> | null)?.[0]?.metadata
  )

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name')
    .eq('id', ctx.school_id)
    .limit(1)

  const schoolName =
    (schoolRaw as Array<{ name: string }> | null)?.[0]?.name ?? 'Établissement scolaire'

  const { data: yearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .limit(1)

  const yearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id
  const { data: classesRaw } = yearId
    ? await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', ctx.school_id)
        .eq('school_year_id', yearId)
        .order('name')
    : { data: [] }

  const classes = (classesRaw as Array<{ id: string; name: string }> | null) ?? []

  const isAwaitingProviseur = dossier.workflowStatus === 'EN_ATTENTE_PROVISEUR'
  const isReturned =
    dossier.requestStatus === 'pending' &&
    dossier.workflowStatus === 'EN_COMPLETION' &&
    Boolean(meta.return_comment?.trim())
  const secretaryCanEdit = isSecretary && !isAwaitingProviseur && !isRejected
  const proviseurCanReview = isProviseur && isAwaitingProviseur
  const trackingRef = meta.tracking_ref ?? formatAdmissionTrackingRef(requestId)
  const studentName = `${dossier.lastName} ${dossier.firstName}`

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={studentName}
        description={`${WORKFLOW_STATUS_LABELS[dossier.workflowStatus]} · ${dossier.className ?? 'Classe à définir'} · ${dossier.iun ?? 'IUN non encore généré'} · Réf. ${trackingRef}`}
      />

      {isRejected && meta.rejection_reason && (
        <Card className="border-red-200 bg-red-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-900">
              <AlertTriangle className="h-4 w-4" />
              Admission refusée définitivement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-red-900/90">
            <p>
              <span className="font-medium">Motif :</span> {meta.rejection_reason}
            </p>
            <p className="text-red-800/80">
              Dossier archivé — remettez l&apos;avis guichet ci-dessous au parent.
            </p>
          </CardContent>
        </Card>
      )}

      {isReturned && meta.return_comment && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900">
              <RotateCcw className="h-4 w-4" />
              Corrections demandées par le proviseur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900/90">
            <p>{meta.return_comment}</p>
            <p className="text-amber-800/80">
              Vous pouvez modifier les pièces et les informations, puis resoumettre le dossier à la
              validation.
            </p>
          </CardContent>
        </Card>
      )}

      {proviseurCanReview && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-900">Revue proviseur</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900/90">
            Consultez l&apos;identité, le parent et chaque PDF téléversé par le secrétariat avant de
            valider, demander une correction ou refuser l&apos;admission.
          </CardContent>
        </Card>
      )}

      <AdmissionDossierForm
        schoolId={ctx.school_id}
        requestId={requestId}
        initial={meta}
        classes={classes}
        readOnly={!secretaryCanEdit}
        documentsReadOnly={!secretaryCanEdit}
      />

      {secretaryCanEdit && (
        <AdmissionSecretaryActions
          requestId={requestId}
          workflowStatus={dossier.workflowStatus}
        />
      )}

      {proviseurCanReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Décision d&apos;admission</CardTitle>
          </CardHeader>
          <CardContent>
            <AdmissionDecisionActions requestId={requestId} />
          </CardContent>
        </Card>
      )}

      {isRejected && meta.rejection_reason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avis guichet — parent</CardTitle>
          </CardHeader>
          <CardContent>
            <AdmissionGuichetNotice
              trackingRef={trackingRef}
              studentName={studentName}
              className={dossier.className}
              variant="refused"
              reason={meta.rejection_reason}
              schoolName={schoolName}
              decidedAt={meta.rejected_at ?? meta.decided_at}
              parentPhone={meta.parent_phone}
            />
          </CardContent>
        </Card>
      )}

      {isReturned && meta.return_comment && isSecretary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avis guichet — corrections</CardTitle>
          </CardHeader>
          <CardContent>
            <AdmissionGuichetNotice
              trackingRef={trackingRef}
              studentName={studentName}
              className={dossier.className}
              variant="returned"
              reason={meta.return_comment}
              schoolName={schoolName}
              decidedAt={meta.returned_at}
              parentPhone={meta.parent_phone}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
