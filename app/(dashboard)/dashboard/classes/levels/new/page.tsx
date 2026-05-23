import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { CreateLevelForm } from '@/features/classes/create-level-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouveau niveau' }

export default async function NewLevelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader title="Nouveau niveau" description="Ajoutez un niveau scolaire à votre établissement" />
      <CreateLevelForm schoolId={ctx.school_id} />
    </div>
  )
}
