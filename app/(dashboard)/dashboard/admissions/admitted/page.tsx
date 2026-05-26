import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canAccessFinance } from '@/lib/dashboard/role-scope'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { getAdmittedAwaitingPayment } from '@/lib/admissions/queries'
import { AdmittedAwaitingPaymentTable } from '@/features/admissions/admitted-awaiting-payment-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admis — paiement à ouvrir',
}

export default async function AdmissionsAdmittedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const isFinance = canAccessFinance(ctx.role_code) && ctx.role_code === 'INTENDANT'
  const isSecretary = ctx.role_code === 'SECRETAIRE'

  if (!isFinance && !isSecretary) {
    redirect('/dashboard')
  }

  const students = await getAdmittedAwaitingPayment(ctx.school_id)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={isFinance ? 'Admis — paiement à ouvrir' : 'Suivi des admissions validées'}
        description={
          isFinance
            ? `${students.length} nouvel${students.length > 1 ? 's' : ''} admis en attente du premier encaissement`
            : 'Consultation des nouveaux admis en attente de premier encaissement (lecture seule)'
        }
        actions={
          isFinance ? (
            <Button asChild size="sm">
              <Link href="/dashboard/finance/payments/new">Nouveau paiement</Link>
            </Button>
          ) : undefined
        }
      />
      <AdmittedAwaitingPaymentTable students={students} canRecordPayment={isFinance} />
    </div>
  )
}
