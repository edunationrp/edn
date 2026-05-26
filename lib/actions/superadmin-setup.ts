'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { PLATFORM_OWNER_ROLE } from '@/lib/platform/access'

function verifySecret(secret: string): string | null {
  const expected = process.env.SUPERADMIN_SETUP_SECRET?.trim()
  if (!expected) {
    return 'SUPERADMIN_SETUP_SECRET manquant dans .env.local — ajoutez-le puis redémarrez le serveur.'
  }
  if (secret.trim() !== expected) {
    return 'Code de configuration incorrect.'
  }
  return null
}

function getAdmin() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

export async function getSuperAdminSetupInfo() {
  const admin = getAdmin()
  const secretConfigured = Boolean(process.env.SUPERADMIN_SETUP_SECRET?.trim())
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!admin) {
    return {
      secretConfigured,
      serviceRoleConfigured,
      superAdminCount: 0,
      error: 'SUPABASE_SERVICE_ROLE_KEY manquant.',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profilesRaw } = await (admin as any)
    .from('profiles')
    .select('id')
    .eq('default_role', PLATFORM_OWNER_ROLE)
    .eq('is_active', true)

  const superAdminCount = (profilesRaw as unknown[] | null)?.length ?? 0

  return {
    secretConfigured,
    serviceRoleConfigured,
    superAdminCount,
    error: null as string | null,
  }
}

export async function bootstrapSuperAdmin(input: {
  setupSecret: string
  mode: 'create' | 'promote'
  email: string
  password?: string
  firstName?: string
  lastName?: string
}) {
  const secretError = verifySecret(input.setupSecret)
  if (secretError) return { error: secretError }

  const admin = getAdmin()
  if (!admin) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY manquant — impossible de créer le super admin.' }
  }

  const email = input.email.trim().toLowerCase()
  if (!email) return { error: 'Email requis.' }

  let userId: string

  if (input.mode === 'create') {
    const password = input.password?.trim()
    if (!password || password.length < 8) {
      return { error: 'Mot de passe requis (8 caractères minimum).' }
    }

    const firstName = input.firstName?.trim() || 'Super'
    const lastName = input.lastName?.trim() || 'Admin'
    const fullName = [firstName, lastName].join(' ')

    const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        default_role: PLATFORM_OWNER_ROLE,
      },
    })

    if (signUpError || !authData.user) {
      const msg = signUpError?.message ?? 'Création impossible.'
      if (/already|registered|exists|duplicate/i.test(msg)) {
        return { error: 'Cet email existe déjà. Utilisez le mode « Promouvoir un compte existant ».' }
      }
      return { error: msg }
    }

    userId = authData.user.id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (admin as any).from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      preferred_language: 'fr',
      default_role: PLATFORM_OWNER_ROLE,
      is_active: true,
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return { error: profileError.message }
    }
  } else {
    const { data: profileRaw } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .limit(1)

    const profile = (profileRaw as Array<{ id: string }> | null)?.[0]
    if (!profile) {
      return { error: 'Aucun compte avec cet email. Créez-le via le mode « Nouveau compte ».' }
    }

    userId = profile.id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (admin as any)
      .from('profiles')
      .update({ default_role: PLATFORM_OWNER_ROLE, is_active: true })
      .eq('id', userId)

    if (profileError) return { error: profileError.message }
  }

  // Ancien modèle : retirer les liaisons établissement super admin (optionnel, idempotent)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('user_school_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_code', PLATFORM_OWNER_ROLE)

  return {
    success: true as const,
    email,
    message:
      'Propriétaire plateforme configuré (sans établissement). Connectez-vous sur /login puis supprimez /superadmin.',
  }
}
