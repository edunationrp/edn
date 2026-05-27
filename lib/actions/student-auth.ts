'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const IUN_REGEX = /^BF-\d{4}-\d{6}-\d$/

// ----------------------------------------------------------------
// 1. Lookup — vérifie que l'IUN existe et renvoie prénom + statut
// ----------------------------------------------------------------
export async function lookupStudentByIun(iun: string) {
  const normalized = iun.trim().toUpperCase()
  if (!IUN_REGEX.test(normalized)) {
    return { error: 'Format IUN invalide (BF-XXXX-XXXXXX-C)' }
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data, error } = await db
    .from('students')
    .select('id, first_name, last_name, status, user_id, activation_code_expires_at')
    .eq('iun', normalized)
    .single()

  if (error || !data) {
    return { error: 'Aucun élève trouvé avec cet IUN' }
  }

  if (data.status === 'inactive' || data.status === 'rejected') {
    return { error: 'Ce dossier élève est inactif. Contactez la secrétariat.' }
  }

  const isActivated = !!data.user_id
  const hasPendingCode =
    !isActivated &&
    data.activation_code_expires_at &&
    new Date(data.activation_code_expires_at) > new Date()

  return {
    student: {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      status: data.status,
      isActivated,
      hasPendingCode: !!hasPendingCode,
    },
  }
}

// ----------------------------------------------------------------
// 2. Générer un code d'activation (secrétaire → élève)
// ----------------------------------------------------------------
const GenerateCodeSchema = z.object({
  studentId: z.string().uuid(),
})

export async function generateStudentActivationCode(studentId: string) {
  const parsed = GenerateCodeSchema.safeParse({ studentId })
  if (!parsed.success) return { error: 'Paramètre invalide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérification du rôle
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: roleRow } = await db
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('role_code', ['SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR'])
    .limit(1)
    .single()

  if (!roleRow) return { error: 'Permission insuffisante' }

  // Générer un code à 6 chiffres
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code))
  const codeHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { error } = await db
    .from('students')
    .update({
      activation_code_hash: codeHash,
      activation_code_expires_at: expiresAt.toISOString(),
      activation_code_generated_at: new Date().toISOString(),
      activation_code_generated_by: user.id,
    })
    .eq('id', studentId)

  if (error) return { error: error.message }

  return { code }
}

// ----------------------------------------------------------------
// 3. Activation du compte (première connexion)
// ----------------------------------------------------------------
const ActivateSchema = z.object({
  iun: z.string().regex(IUN_REGEX, 'Format IUN invalide'),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
})

export async function activateStudentAccount(formData: {
  iun: string
  code: string
  password: string
}) {
  const parsed = ActivateSchema.safeParse({
    iun: formData.iun.trim().toUpperCase(),
    code: formData.code.trim(),
    password: formData.password,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const { iun, code, password } = parsed.data

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // Récupérer l'élève
  const { data: student, error: studentErr } = await db
    .from('students')
    .select('id, user_id, activation_code_hash, activation_code_expires_at, first_name, last_name, school_id')
    .eq('iun', iun)
    .single()

  if (studentErr || !student) {
    return { error: 'IUN introuvable' }
  }

  if (student.user_id) {
    return { error: 'Ce compte est déjà activé. Connectez-vous avec votre mot de passe.' }
  }

  if (!student.activation_code_hash || !student.activation_code_expires_at) {
    return { error: 'Aucun code d\'activation. Demandez-en un au secrétariat.' }
  }

  if (new Date(student.activation_code_expires_at) < new Date()) {
    return { error: 'Code expiré. Demandez un nouveau code au secrétariat.' }
  }

  // Vérifier le hash
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code))
  const codeHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (codeHash !== student.activation_code_hash) {
    return { error: 'Code incorrect' }
  }

  // Créer le compte Supabase Auth
  const syntheticEmail = `eleve-${iun.toLowerCase().replace(/-/g, '')}@eleves.edunation.bf`

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `${student.first_name} ${student.last_name}`,
      role: 'ELEVE',
    },
  })

  if (authErr || !authData.user) {
    return { error: authErr?.message ?? 'Erreur création du compte' }
  }

  // Créer le profil
  await db.from('profiles').insert({
    id: authData.user.id,
    full_name: `${student.first_name} ${student.last_name}`,
    email: syntheticEmail,
    default_role: 'ELEVE',
    is_active: true,
  })

  // Lier le user_id à l'élève + effacer le code d'activation
  const { error: updateErr } = await db
    .from('students')
    .update({
      user_id: authData.user.id,
      activation_code_hash: null,
      activation_code_expires_at: null,
    })
    .eq('id', student.id)

  if (updateErr) {
    // Rollback: supprimer l'utilisateur créé
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: updateErr.message }
  }

  // Créer le rôle ELEVE dans user_school_roles
  await db.from('user_school_roles').insert({
    user_id: authData.user.id,
    school_id: student.school_id,
    role_code: 'ELEVE',
    is_active: true,
  })

  return { success: true }
}

// ----------------------------------------------------------------
// 4. Connexion élève (IUN + mot de passe)
// ----------------------------------------------------------------
const LoginSchema = z.object({
  iun: z.string().regex(IUN_REGEX, 'Format IUN invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export async function studentLogin(formData: { iun: string; password: string }) {
  const parsed = LoginSchema.safeParse({
    iun: formData.iun.trim().toUpperCase(),
    password: formData.password,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const { iun, password } = parsed.data

  const syntheticEmail = `eleve-${iun.toLowerCase().replace(/-/g, '')}@eleves.edunation.bf`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login')) {
      return { error: 'IUN ou mot de passe incorrect' }
    }
    return { error: error.message }
  }

  return { success: true }
}

// ----------------------------------------------------------------
// 5. Régénérer un code d'activation (renouvellement)
// ----------------------------------------------------------------
export async function regenerateStudentActivationCode(studentId: string) {
  return generateStudentActivationCode(studentId)
}
