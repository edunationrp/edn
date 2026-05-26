import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { NewPaymentForm } from '@/features/finance/new-payment-form'
import { canEncashPayments } from '@/lib/finance/access'
import { Loader2 } from 'lucide-react'

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>
}) {
  const { studentId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!canEncashPayments(ctx.role_code)) redirect('/dashboard')

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name')
    .eq('id', ctx.school_id)
    .single()

  const schoolName = (schoolRaw as { name: string } | null)?.name ?? 'Mon établissement'

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Encaissement</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Dossier élève, frais officiels, suppléments et reçu de paiement
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        }
      >
        <NewPaymentForm
          schoolId={ctx.school_id}
          schoolName={schoolName}
          cassierId={user.id}
          initialStudentId={studentId ?? null}
        />
      </Suspense>
    </div>
  )
}
