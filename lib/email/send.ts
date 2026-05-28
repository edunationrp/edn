'use server'

import { getEmailFrom, getResendClient, isEmailConfigured } from '@/lib/email/client'
import {
  accountCreatedEmail,
  notificationEmail,
  paymentReceiptEmail,
  staffInviteEmail,
  trialEndedEmail,
  trialReminderEmail,
  welcomeDirectorEmail,
  registrationCompleteEmail,
  parentRegistrationOtpEmail,
  parentCredentialsEmail,
  type AccountCreatedEmailData,
  type RegistrationCompleteEmailData,
  type ParentOtpEmailData,
  type ParentCredentialsEmailData,
  type NotificationEmailData,
  type PaymentReceiptEmailData,
  type StaffInviteEmailData,
  type TrialEndedEmailData,
  type TrialReminderEmailData,
  type WelcomeDirectorEmailData,
} from '@/lib/email/templates'

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { ok: true; skipped: true }

async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    console.warn('[email] RESEND_API_KEY manquant — email non envoyé:', subject)
    return { ok: true, skipped: true }
  }

  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'Service email non configuré.' }
  }

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: [to],
    subject,
    html,
  })

  if (error) {
    console.error('[email] Erreur Resend:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, id: data?.id ?? 'unknown' }
}

export async function sendRegistrationCompleteEmail(
  to: string,
  payload: RegistrationCompleteEmailData
): Promise<SendEmailResult> {
  const { subject, html } = registrationCompleteEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendWelcomeDirectorEmail(
  to: string,
  payload: WelcomeDirectorEmailData
): Promise<SendEmailResult> {
  const { subject, html } = welcomeDirectorEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendAccountCreatedEmail(
  to: string,
  payload: AccountCreatedEmailData
): Promise<SendEmailResult> {
  const { subject, html } = accountCreatedEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendTrialReminderEmail(
  to: string,
  payload: TrialReminderEmailData
): Promise<SendEmailResult> {
  const { subject, html } = trialReminderEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendTrialEndedEmail(
  to: string,
  payload: TrialEndedEmailData
): Promise<SendEmailResult> {
  const { subject, html } = trialEndedEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendStaffInviteEmail(
  to: string,
  payload: StaffInviteEmailData
): Promise<SendEmailResult> {
  const { subject, html } = staffInviteEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendNotificationEmail(
  to: string,
  payload: NotificationEmailData
): Promise<SendEmailResult> {
  const { subject, html } = notificationEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendPaymentReceiptEmail(
  to: string,
  payload: PaymentReceiptEmailData
): Promise<SendEmailResult> {
  const { subject, html } = paymentReceiptEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendParentRegistrationOtpEmail(
  to: string,
  payload: ParentOtpEmailData,
): Promise<SendEmailResult> {
  const { subject, html } = parentRegistrationOtpEmail(payload)
  return sendEmail(to, subject, html)
}

export async function sendParentCredentialsEmail(
  to: string,
  payload: ParentCredentialsEmailData,
): Promise<SendEmailResult> {
  const { subject, html } = parentCredentialsEmail(payload)
  return sendEmail(to, subject, html)
}
