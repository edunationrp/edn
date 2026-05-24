import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { getScopedStudentIds, canAccessFinance } from '@/lib/dashboard/role-scope'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { PaymentsTable } from '@/features/finance/payments-table'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paiements' }

type Payment = {
  id: string
  reference: string | null
  amount: number
  payment_method: string
  status: string
  created_at: string
  student_id: string | null
  students?: { first_name: string; last_name: string } | null
}

export default async function PaymentsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const scopedStudentIds = await getScopedStudentIds(user.id, ctx.role_code)
  if (scopedStudentIds !== null && scopedStudentIds.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Mes paiements" description="Aucun élève lié à votre compte." />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Contactez l&apos;établissement pour associer votre compte à un élève.
          </CardContent>
        </Card>
      </div>
    )
  }

  let query = supabase
    .from('payments')
    .select('id, reference, amount, payment_method, status, created_at, student_id, students(first_name, last_name)')
    .eq('school_id', ctx.school_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (scopedStudentIds) {
    query = query.in('student_id', scopedStudentIds)
  }

  const { data: paymentsRaw } = await query
  const payments = ((paymentsRaw as Payment[] | null) ?? []).map(p => ({
    id: p.id,
    reference: p.reference,
    amount: p.amount,
    payment_method: p.payment_method,
    status: p.status,
    created_at: p.created_at,
    studentName: p.students
      ? `${p.students.last_name} ${p.students.first_name}`
      : 'Élève',
  }))

  const isStaff = canAccessFinance(ctx.role_code)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={isStaff ? 'Tous les paiements' : 'Mes paiements'}
        description={`${payments.length} transaction(s) récente(s)`}
        actions={
          isStaff ? (
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/finance/payments/new">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau paiement
              </Link>
            </Button>
          ) : undefined
        }
      />

      <PaymentsTable payments={payments} />
    </div>
  )
}
