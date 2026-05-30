'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

const DeductionSchema = z.object({
  studentId: z.string().uuid(),
  term: z.enum(['T1', 'T2', 'T3']).optional(),
  points: z.number().min(0.25).max(20),
  reason: z.string().min(3),
  deductedAt: z.string().optional(),
})

export async function addConductPointDeduction(input: z.infer<typeof DeductionSchema>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'discipline:manage') && !hasPermission(role, 'students:update')) {
    return { error: 'Vous n\'avez pas les droits pour enregistrer un retrait de points.' }
  }

  const parsed = DeductionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: yearRow } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('conduct_point_deductions').insert({
    school_id: ctx.school_id,
    student_id: parsed.data.studentId,
    school_year_id: (yearRow as { id: string } | null)?.id ?? null,
    term: parsed.data.term ?? null,
    points: parsed.data.points,
    reason: parsed.data.reason,
    deducted_at: parsed.data.deductedAt ?? new Date().toISOString().slice(0, 10),
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/students/${parsed.data.studentId}`)
  return { success: true as const }
}

export async function getStudentConductDeductions(studentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('conduct_point_deductions')
    .select('id, term, points, reason, deducted_at, created_at')
    .eq('school_id', ctx.school_id)
    .eq('student_id', studentId)
    .order('deducted_at', { ascending: false })

  return ((data ?? []) as Array<{
    id: string
    term: string | null
    points: number
    reason: string
    deducted_at: string
    created_at: string
  }>).map(row => ({
    id: row.id,
    term: row.term,
    points: Number(row.points),
    reason: row.reason,
    deductedAt: row.deducted_at,
    createdAt: row.created_at,
  }))
}

export async function deleteConductPointDeduction(deductionId: string, studentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'discipline:manage') && !hasPermission(role, 'students:update')) {
    return { error: 'Non autorisé.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('conduct_point_deductions')
    .delete()
    .eq('id', deductionId)
    .eq('school_id', ctx.school_id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/students/${studentId}`)
  return { success: true as const }
}
