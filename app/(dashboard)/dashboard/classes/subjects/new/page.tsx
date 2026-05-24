import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canManageSubjects } from '@/lib/classes/access'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { CreateSubjectForm } from '@/features/classes/create-subject-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouvelle matière' }

export default async function NewSubjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')
  if (!canManageSubjects(ctx.role_code)) redirect('/dashboard/classes')

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader title="Nouvelle matière" description="Ajoutez une matière enseignée dans votre établissement" />
      <CreateSubjectForm schoolId={ctx.school_id} />
    </div>
  )
}
