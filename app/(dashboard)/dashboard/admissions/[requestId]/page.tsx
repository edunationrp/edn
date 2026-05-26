import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import {
  canAccessProviseurAdmissionValidation,
  canAccessSecretaryAdmissionQueue,
} from '@/lib/admissions/access'
import { getAdmissionRequest } from '@/lib/admissions/queries'
import { parseDossierMetadata } from '@/lib/admissions/dossier-metadata'
import { PageHeader } from '@/components/dashboard/page-header'
import { AdmissionDossierForm } from '@/features/admissions/admission-dossier-form'
import { AdmissionSecretaryActions } from '@/features/admissions/admission-secretary-actions'
import { WORKFLOW_STATUS_LABELS } from '@/lib/admissions/workflow'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>
}): Promise<Metadata> {
  const { requestId } = await params
  return { title: `Dossier admission` }
}

export default async function AdmissionDossierPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const isSecretary = canAccessSecretaryAdmissionQueue(ctx.role_code)
  const isProviseur = canAccessProviseurAdmissionValidation(ctx.role_code)
  if (!isSecretary && !isProviseur) redirect('/dashboard')

  const dossier = await getAdmissionRequest(ctx.school_id, requestId)
  if (!dossier) notFound()

  const { data: requestRaw } = await supabase
    .from('student_registration_requests')
    .select('metadata')
    .eq('id', requestId)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const meta = parseDossierMetadata(
    (requestRaw as Array<{ metadata: Record<string, unknown> | null }> | null)?.[0]?.metadata
  )

  const { data: yearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .limit(1)

  const yearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id
  const { data: classesRaw } = yearId
    ? await supabase.from('classes').select('id, name').eq('school_id', ctx.school_id).eq('school_year_id', yearId).order('name')
    : { data: [] }

  const classes = (classesRaw as Array<{ id: string; name: string }> | null) ?? []
  const readOnly = !isSecretary || dossier.workflowStatus === 'EN_ATTENTE_PROVISEUR'

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={`${dossier.lastName} ${dossier.firstName}`}
        description={`${WORKFLOW_STATUS_LABELS[dossier.workflowStatus]} · ${dossier.className ?? 'Classe à définir'} · ${dossier.iun ?? 'IUN non encore généré'}`}
      />
      <AdmissionDossierForm
        requestId={requestId}
        initial={meta}
        classes={classes}
        readOnly={readOnly}
      />
      {isSecretary && !readOnly && (
        <AdmissionSecretaryActions
          requestId={requestId}
          workflowStatus={dossier.workflowStatus}
        />
      )}
    </div>
  )
}
