import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canAccessProviseurAdmissionValidation } from '@/lib/admissions/access'
import { PageHeader } from '@/components/dashboard/page-header'
import { MinimalAdmissionRequestForm } from '@/features/admissions/minimal-admission-request-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouvelle demande d\'admission',
}

export default async function NewAdmissionRequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!canAccessProviseurAdmissionValidation(ctx.role_code)) redirect('/dashboard')

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

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Créer une demande d'admission"
        description="Après entretien avec le parent — le secrétariat complétera le dossier"
      />
      <MinimalAdmissionRequestForm classes={classes} />
    </div>
  )
}
