'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  sendParentCredentialsEmail,
  sendParentRegistrationOtpEmail,
} from '@/lib/email/send'
import {
  generateParentCode,
  generateParentPassword,
  isValidParentCode,
  normalizeParentCode,
  parentCodeToAuthEmail,
} from '@/lib/parent/credentials'
import { generateSixDigitCode, hashVerificationCode } from '@/lib/parent/verification'
import { z } from 'zod'

const PHONE_REGEX = /^\+?[0-9]{8,15}$/
const GMAIL_REGEX = /^[^\s@]+@(gmail|googlemail)\.com$/i

type RegistrationChannel = 'phone' | 'gmail'

function getAdminDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any
}

async function invalidatePendingSessions(
  db: ReturnType<typeof getAdminDb>,
  channel: RegistrationChannel,
  destination: { phone?: string; email?: string },
) {
  let query = db
    .from('parent_registration_sessions')
    .update({ consumed_at: new Date().toISOString() })
    .eq('channel', channel)
    .is('consumed_at', null)

  if (channel === 'phone' && destination.phone) {
    query = query.eq('phone', destination.phone)
  }
  if (channel === 'gmail' && destination.email) {
    query = query.eq('email', destination.email.toLowerCase())
  }

  await query
}

async function createOtpSession(
  channel: RegistrationChannel,
  destination: { phone?: string; email?: string },
) {
  const db = getAdminDb()
  const code = generateSixDigitCode()
  const codeHash = await hashVerificationCode(code)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  await invalidatePendingSessions(db, channel, destination)

  const row = channel === 'phone'
    ? { channel, phone: destination.phone!.trim(), code_hash: codeHash, expires_at: expiresAt.toISOString() }
    : { channel, email: destination.email!.trim().toLowerCase(), code_hash: codeHash, expires_at: expiresAt.toISOString() }

  const { data, error } = await db
    .from('parent_registration_sessions')
    .insert(row)
    .select('id')
    .single()

  if (error) return { error: error.message as string }
  return { sessionId: data.id as string, code }
}

// ----------------------------------------------------------------
// 1. Envoyer OTP (téléphone ou Gmail)
// ----------------------------------------------------------------
export async function sendParentRegistrationOtp(input: {
  channel: RegistrationChannel
  phone?: string
  email?: string
}) {
  if (input.channel === 'phone') {
    const phone = input.phone?.trim() ?? ''
    if (!PHONE_REGEX.test(phone)) return { error: 'Numéro de téléphone invalide.' }

    const db = getAdminDb()
    const { data: existing } = await db
      .from('parent_accounts')
      .select('id')
      .eq('phone_primary', phone)
      .maybeSingle()

    if (existing) {
      return { error: 'Un compte parent existe déjà avec ce numéro. Connectez-vous.' }
    }

    const result = await createOtpSession('phone', { phone })
    if ('error' in result && result.error) return { error: result.error }

    console.info(`[DEV] OTP parent SMS ${phone}: ${result.code}`)
    return { success: true as const, sessionId: result.sessionId }
  }

  const email = input.email?.trim().toLowerCase() ?? ''
  if (!GMAIL_REGEX.test(email)) {
    return { error: 'Adresse Gmail invalide (ex. nom@gmail.com).' }
  }

  const result = await createOtpSession('gmail', { email })
  if ('error' in result && result.error) return { error: result.error }

  const mailResult = await sendParentRegistrationOtpEmail(email, { code: result.code! })
  if (!mailResult.ok && !('skipped' in mailResult && mailResult.skipped)) {
    console.info(`[DEV] OTP parent Gmail ${email}: ${result.code}`)
  }

  return { success: true as const, sessionId: result.sessionId }
}

// ----------------------------------------------------------------
// 2. Vérifier OTP
// ----------------------------------------------------------------
const VerifyOtpSchema = z.object({
  sessionId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d+$/, 'Code invalide'),
})

export async function verifyParentRegistrationOtp(formData: {
  sessionId: string
  code: string
}) {
  const parsed = VerifyOtpSchema.safeParse({
    sessionId: formData.sessionId,
    code: formData.code.trim(),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const db = getAdminDb()
  const codeHash = await hashVerificationCode(parsed.data.code)

  const { data: session, error } = await db
    .from('parent_registration_sessions')
    .select('id, channel, phone, email, code_hash, otp_attempts, otp_verified, expires_at, consumed_at')
    .eq('id', parsed.data.sessionId)
    .maybeSingle()

  if (error || !session) return { error: 'Session introuvable. Recommencez l\'inscription.' }
  if (session.consumed_at) return { error: 'Cette session a déjà été utilisée.' }
  if (session.otp_verified) return { success: true as const, sessionId: session.id as string }

  if (new Date(session.expires_at as string) < new Date()) {
    return { error: 'Code expiré. Demandez un nouveau code.' }
  }

  if (session.code_hash !== codeHash) {
    await db
      .from('parent_registration_sessions')
      .update({ otp_attempts: (session.otp_attempts ?? 0) + 1 })
      .eq('id', parsed.data.sessionId)
    return { error: 'Code incorrect ou expiré.' }
  }

  const profileExpires = new Date()
  profileExpires.setMinutes(profileExpires.getMinutes() + 30)

  await db
    .from('parent_registration_sessions')
    .update({
      otp_verified: true,
      expires_at: profileExpires.toISOString(),
    })
    .eq('id', parsed.data.sessionId)

  return { success: true as const, sessionId: session.id as string }
}

// ----------------------------------------------------------------
// 3. Finaliser l'inscription (profil + identifiants)
// ----------------------------------------------------------------
const CompleteRegistrationSchema = z.object({
  sessionId: z.string().uuid(),
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  phonePrimary: z.string().regex(PHONE_REGEX, 'Téléphone principal invalide'),
  phoneSecondary: z.string().regex(PHONE_REGEX, 'Téléphone secondaire invalide').optional().or(z.literal('')),
})

export async function completeParentRegistration(formData: {
  sessionId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phonePrimary: string
  phoneSecondary?: string
}) {
  const parsed = CompleteRegistrationSchema.safeParse({
    ...formData,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    phonePrimary: formData.phonePrimary.trim(),
    phoneSecondary: formData.phoneSecondary?.trim() || '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const db = getAdminDb()
  const admin = createAdminClient()

  const { data: session, error: sessionErr } = await db
    .from('parent_registration_sessions')
    .select('id, channel, phone, email, otp_verified, expires_at, consumed_at')
    .eq('id', parsed.data.sessionId)
    .maybeSingle()

  if (sessionErr || !session) return { error: 'Session introuvable.' }
  if (!session.otp_verified) return { error: 'Vérifiez d\'abord votre code.' }
  if (session.consumed_at) return { error: 'Inscription déjà finalisée.' }
  if (new Date(session.expires_at as string) < new Date()) {
    return { error: 'Session expirée. Recommencez l\'inscription.' }
  }

  const phonePrimary = parsed.data.phonePrimary
  const phoneSecondary = parsed.data.phoneSecondary || null

  const { data: phoneTaken } = await db
    .from('parent_accounts')
    .select('id')
    .eq('phone_primary', phonePrimary)
    .maybeSingle()

  if (phoneTaken) {
    return { error: 'Ce numéro de téléphone est déjà utilisé par un compte parent.' }
  }

  let parentCode = generateParentCode()
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data: existingCode } = await db
      .from('parent_accounts')
      .select('id')
      .eq('parent_code', parentCode)
      .maybeSingle()
    if (!existingCode) break
    parentCode = generateParentCode()
  }

  const password = generateParentPassword(10)
  const authEmail = parentCodeToAuthEmail(parentCode)
  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`
  const contactEmail = session.channel === 'gmail' ? (session.email as string) : null

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    phone: phonePrimary,
    user_metadata: {
      full_name: fullName,
      default_role: 'PARENT',
      parent_code: parentCode,
      phone: phonePrimary,
      ...(contactEmail ? { contact_email: contactEmail } : {}),
    },
  })

  if (authErr || !authData.user) {
    return { error: authErr?.message ?? 'Erreur lors de la création du compte.' }
  }

  // Le trigger handle_new_user crée déjà la ligne profiles — upsert pour éviter profiles_pkey
  const { error: profileErr } = await db.from('profiles').upsert(
    {
      id: authData.user.id,
      full_name: fullName,
      email: contactEmail ?? authEmail,
      phone: phonePrimary,
      default_role: 'PARENT',
      is_active: true,
    },
    { onConflict: 'id' },
  )

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: profileErr.message }
  }

  const { error: accountErr } = await db.from('parent_accounts').insert({
    id: authData.user.id,
    parent_code: parentCode,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    date_of_birth: parsed.data.dateOfBirth,
    phone_primary: phonePrimary,
    phone_secondary: phoneSecondary,
    contact_email: contactEmail,
    registration_channel: session.channel,
    auth_email: authEmail,
  })

  if (accountErr) {
    await db.from('profiles').delete().eq('id', authData.user.id)
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: accountErr.message }
  }

  await db
    .from('parent_registration_sessions')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', parsed.data.sessionId)

  const credentialsPayload = {
    fullName,
    parentCode,
    password,
  }

  if (session.channel === 'gmail' && contactEmail) {
    await sendParentCredentialsEmail(contactEmail, credentialsPayload)
  } else if (contactEmail) {
    await sendParentCredentialsEmail(contactEmail, credentialsPayload)
  } else {
    console.info(`[DEV] Identifiants parent SMS ${phonePrimary}: ${parentCode} / ${password}`)
  }

  return {
    success: true as const,
    parentCode,
    deliveryChannel: session.channel as RegistrationChannel,
    contactEmail,
    phonePrimary,
    devPassword: process.env.NODE_ENV === 'development' ? password : undefined,
  }
}

// ----------------------------------------------------------------
// 4. Connexion parent (E0… + mot de passe)
// ----------------------------------------------------------------
const ParentLoginSchema = z.object({
  parentCode: z.string().refine(value => isValidParentCode(value), {
    message: 'Identifiant invalide (format E0XXXXXXXXXX)',
  }),
  password: z.string().min(1, 'Mot de passe requis'),
})

export async function loginParent(formData: { parentCode: string; password: string }) {
  const parsed = ParentLoginSchema.safeParse({
    parentCode: normalizeParentCode(formData.parentCode),
    password: formData.password,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const db = getAdminDb()
  const { data: account } = await db
    .from('parent_accounts')
    .select('auth_email, parent_code')
    .eq('parent_code', parsed.data.parentCode)
    .maybeSingle()

  if (!account) {
    return { error: 'Identifiant ou mot de passe incorrect.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: account.auth_email as string,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('invalid')) {
      return { error: 'Identifiant ou mot de passe incorrect.' }
    }
    return { error: error.message }
  }

  return { success: true as const }
}

// Compatibilité anciens imports (non utilisés par le nouveau flux)
export async function sendParentOtp(phone: string) {
  return sendParentRegistrationOtp({ channel: 'phone', phone })
}

export async function verifyParentOtpAndRegister() {
  return { error: 'Utilisez le nouveau parcours d\'inscription parent.' }
}
