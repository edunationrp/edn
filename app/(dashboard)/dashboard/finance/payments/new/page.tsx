import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { NewPaymentForm } from '@/features/finance/new-payment-form'

export default async function NewPaymentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name')
    .eq('id', ctx.school_id)
    .single()

  const schoolName = (schoolRaw as { name: string } | null)?.name ?? 'Mon établissement'

  const [feesResult, yearsResult] = await Promise.all([
    supabase.from('fee_structures').select('id, name, amount, is_mandatory').eq('school_id', ctx.school_id).order('name'),
    supabase.from('school_years').select('id, name').eq('school_id', ctx.school_id).eq('is_active', true).limit(1),
  ])

  const fees = (feesResult.data as Array<{ id: string; name: string; amount: number; is_mandatory: boolean }> | null) ?? []
  const years = (yearsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const currentYear = years[0] ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enregistrer un paiement</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Rechercher un élève et enregistrer son paiement
        </p>
      </div>
      <NewPaymentForm
        schoolId={ctx.school_id}
        schoolName={schoolName}
        cassierId={user.id}
        feeStructures={fees}
        currentYear={currentYear}
      />
    </div>
  )
}
