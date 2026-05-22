import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM ?? 'EduNation <onboarding@resend.dev>'
}

import { getPublicAppUrl } from '@/lib/env/public'

export function getAppUrl() {
  return getPublicAppUrl()
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}
