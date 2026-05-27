'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const PHONE_REGEX = /^\+?[0-9]{8,15}$/

// ----------------------------------------------------------------
// 1. Envoyer un OTP SMS (via Supabase Auth OTP)
// ----------------------------------------------------------------
const SendOtpSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'Numéro de téléphone invalide'),
})

export async function sendParentOtp(phone: string) {
  const parsed = SendOtpSchema.safeParse({ phone: phone.trim() })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()

  // Utiliser Supabase Auth OTP (SMS)
  const { error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: `parent-${phone.replace(/\D/g, '')}@parents.edunation.bf`,
  })

  // En pratique on utilise signInWithOtp pour l'OTP SMS
  // Mais comme c'est admin client, on crée un code SMS manuel via la table sms_verification_codes
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code))
  const codeHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Invalider les anciens codes pour ce numéro
  await admin
    .from('sms_verification_codes')
    .update({ verified_at: new Date().toISOString() })
    .eq('phone', phone)
    .eq('purpose', 'parent_registration')
    .is('verified_at', null)

  const { error: insertErr } = await admin.from('sms_verification_codes').insert({
    phone: phone.trim(),
    code_hash: codeHash,
    purpose: 'parent_registration',
    expires_at: expiresAt.toISOString(),
    attempts: 0,
  })

  if (insertErr) return { error: insertErr.message }

  // TODO: Envoyer le SMS via votre fournisseur SMS
  // Pour le test local, on logue le code en console
  console.info(`[DEV] OTP parent ${phone}: ${code}`)

  return { success: true }
}

// ----------------------------------------------------------------
// 2. Vérifier le code OTP et créer le compte parent
// ----------------------------------------------------------------
const VerifyOtpSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'Numéro invalide'),
  code: z.string().length(6).regex(/^\d+$/, 'Code invalide'),
  fullName: z.string().min(2, 'Nom requis'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
})

export async function verifyParentOtpAndRegister(formData: {
  phone: string
  code: string
  fullName: string
  password: string
}) {
  const parsed = VerifyOtpSchema.safeParse({
    phone: formData.phone.trim(),
    code: formData.code.trim(),
    fullName: formData.fullName.trim(),
    password: formData.password,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { phone, code, fullName, password } = parsed.data

  const admin = createAdminClient()

  // Vérifier le code
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code))
  const codeHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const { data: codeRecord, error: codeErr } = await admin
    .from('sms_verification_codes')
    .select('id, attempts')
    .eq('phone', phone)
    .eq('code_hash', codeHash)
    .eq('purpose', 'parent_registration')
    .is('verified_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (codeErr || !codeRecord) {
    // Incrémenter les tentatives
    await admin
      .from('sms_verification_codes')
      .update({ attempts: (codeRecord?.attempts ?? 0) + 1 })
      .eq('phone', phone)
      .eq('purpose', 'parent_registration')
      .is('verified_at', null)
    return { error: 'Code incorrect ou expiré' }
  }

  // Marquer le code comme vérifié
  await admin
    .from('sms_verification_codes')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', codeRecord.id)

  // Vérifier si le compte existe déjà
  const syntheticEmail = `parent-${phone.replace(/\D/g, '')}@parents.edunation.bf`

  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === syntheticEmail)

  if (existingUser) {
    return { error: 'Un compte existe déjà avec ce numéro. Connectez-vous via la page de connexion.' }
  }

  // Créer le compte Auth
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
    phone: phone,
    user_metadata: {
      full_name: fullName,
      role: 'PARENT',
      phone: phone,
    },
  })

  if (authErr || !authData.user) {
    return { error: authErr?.message ?? 'Erreur création du compte' }
  }

  // Créer le profil
  const { error: profileErr } = await admin.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName,
    email: syntheticEmail,
    phone: phone,
    default_role: 'PARENT',
    is_active: true,
  })

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: profileErr.message }
  }

  return { success: true }
}
