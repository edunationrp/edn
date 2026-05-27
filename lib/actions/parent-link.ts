'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const IUN_REGEX = /^BF-\d{4}-\d{6}-\d$/

// ----------------------------------------------------------------
// 1. Parent : soumettre une demande de rattachement par IUN
// ----------------------------------------------------------------
const RequestLinkSchema = z.object({
  studentIun: z.string().regex(IUN_REGEX, 'Format IUN invalide'),
  relationship: z.enum(['parent', 'tuteur', 'autre']),
  message: z.string().max(500).optional(),
})

export async function requestParentStudentLink(formData: {
  studentIun: string
  relationship: 'parent' | 'tuteur' | 'autre'
  message?: string
}) {
  const parsed = RequestLinkSchema.safeParse({
    ...formData,
    studentIun: formData.studentIun.trim().toUpperCase(),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { studentIun, relationship, message } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()

  // Vérifier que l'étudiant existe
  const { data: student, error: studentErr } = await admin
    .from('students')
    .select('id, school_id, status')
    .eq('iun', studentIun)
    .single()

  if (studentErr || !student) return { error: 'IUN introuvable' }
  if (student.status !== 'active') return { error: 'Dossier élève inactif' }

  // Vérifier qu'il n'y a pas déjà une demande en attente
  const { data: existing } = await admin
    .from('parent_link_requests')
    .select('id, status')
    .eq('parent_user_id', user.id)
    .eq('student_iun', studentIun)
    .eq('status', 'pending')
    .single()

  if (existing) return { error: 'Une demande est déjà en cours pour cet élève' }

  // Vérifier qu'il n'est pas déjà lié
  const { data: existingLink } = await admin
    .from('parent_student_relations')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', student.id)
    .single()

  if (existingLink) return { error: 'Vous êtes déjà rattaché à cet élève' }

  // Créer la demande
  const { error: insertErr } = await admin.from('parent_link_requests').insert({
    parent_user_id: user.id,
    school_id: student.school_id,
    student_iun: studentIun,
    student_id: student.id,
    relationship,
    message: message ?? null,
    status: 'pending',
  })

  if (insertErr) return { error: insertErr.message }

  return { success: true }
}

// ----------------------------------------------------------------
// 2. Parent : lister ses demandes
// ----------------------------------------------------------------
export async function getMyLinkRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('parent_link_requests')
    .select('id, student_iun, relationship, status, message, created_at, reviewed_at')
    .eq('parent_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { requests: data ?? [] }
}

// ----------------------------------------------------------------
// 3. Secrétaire : lister les demandes en attente de son école
// ----------------------------------------------------------------
export async function getSchoolLinkRequests(schoolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()

  // Vérifier le rôle
  const { data: roleRow } = await admin
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', user.id)
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .in('role_code', ['SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR'])
    .limit(1)
    .single()

  if (!roleRow) return { error: 'Permission insuffisante' }

  const { data, error } = await admin
    .from('parent_link_requests')
    .select(`
      id, student_iun, relationship, status, message, created_at,
      profiles!parent_user_id(full_name, phone),
      students!student_id(first_name, last_name)
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  return { requests: (data ?? []) as any[] }
}

// ----------------------------------------------------------------
// 4. Secrétaire : approuver une demande
// ----------------------------------------------------------------
export async function approveLinkRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()

  const { data: req, error: reqErr } = await admin
    .from('parent_link_requests')
    .select('id, parent_user_id, student_id, student_iun, school_id, relationship')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single()

  if (reqErr || !req) return { error: 'Demande introuvable' }

  // Vérifier le rôle du validateur
  const { data: roleRow } = await admin
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', user.id)
    .eq('school_id', req.school_id)
    .eq('is_active', true)
    .in('role_code', ['SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR'])
    .limit(1)
    .single()

  if (!roleRow) return { error: 'Permission insuffisante' }

  // Créer la relation parent ↔ élève
  const { error: linkErr } = await admin.from('parent_student_relations').insert({
    parent_id: req.parent_user_id,
    student_id: req.student_id,
    school_id: req.school_id,
    relationship: req.relationship,
    is_active: true,
  })

  if (linkErr && !linkErr.message.includes('duplicate')) {
    return { error: linkErr.message }
  }

  // Attribuer le rôle PARENT dans l'école si pas déjà fait
  await admin.from('user_school_roles').upsert({
    user_id: req.parent_user_id,
    school_id: req.school_id,
    role_code: 'PARENT',
    is_active: true,
  }, { onConflict: 'user_id,school_id,role_code' })

  // Marquer la demande comme approuvée
  await admin.from('parent_link_requests').update({
    status: 'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId)

  return { success: true }
}

// ----------------------------------------------------------------
// 5. Secrétaire : rejeter une demande
// ----------------------------------------------------------------
export async function rejectLinkRequest(requestId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()

  const { data: req, error: reqErr } = await admin
    .from('parent_link_requests')
    .select('id, school_id')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single()

  if (reqErr || !req) return { error: 'Demande introuvable' }

  const { data: roleRow } = await admin
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', user.id)
    .eq('school_id', req.school_id)
    .eq('is_active', true)
    .in('role_code', ['SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR'])
    .limit(1)
    .single()

  if (!roleRow) return { error: 'Permission insuffisante' }

  await admin.from('parent_link_requests').update({
    status: 'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    message: reason ?? null,
  }).eq('id', requestId)

  return { success: true }
}
