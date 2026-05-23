'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createFeeStructure(
  schoolId: string,
  data: {
    schoolYearId: string
    name: string
    amount: number
    isMandatory: boolean
    dueDate?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('fee_structures').insert({
    school_id: schoolId,
    school_year_id: data.schoolYearId,
    name: data.name,
    amount: data.amount,
    is_mandatory: data.isMandatory,
    due_date: data.dueDate ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}
