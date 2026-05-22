'use server'

import { sendAccountCreatedEmail } from '@/lib/email/send'

export async function sendDirectorWelcomeEmailAction(input: {
  email: string
  fullName: string
}) {
  if (!input.email || !input.fullName) {
    return { ok: false as const, error: 'Email ou nom manquant.' }
  }

  return sendAccountCreatedEmail(input.email, { fullName: input.fullName })
}
