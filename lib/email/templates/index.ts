export { EMAIL_BRAND, EMAIL_SUPPORT, TRIAL_PERIOD_DAYS } from '@/lib/email/templates/brand'
export {
  badge,
  ctaButton,
  divider,
  escapeHtml,
  featureRow,
  heading,
  infoBox,
  linkFallback,
  otpBox,
  paragraph,
  quoteBlock,
  secondaryLink,
  signatureBlock,
  stepsList,
  supportLine,
  trialProgress,
} from '@/lib/email/templates/components'
export { baseEmailLayout, supabaseAuthEmailLayout } from '@/lib/email/templates/layout'

export {
  accountCreatedEmail,
  notificationEmail,
  paymentReceiptEmail,
  staffInviteEmail,
  trialEndedEmail,
  trialReminderEmail,
  welcomeDirectorEmail,
  type AccountCreatedEmailData,
  type NotificationEmailData,
  type PaymentReceiptEmailData,
  type StaffInviteEmailData,
  type TrialEndedEmailData,
  type TrialReminderEmailData,
  type WelcomeDirectorEmailData,
} from '@/lib/email/templates/app-emails'

export {
  SUPABASE_AUTH_TEMPLATES,
  supabaseConfirmSignupTemplate,
  supabaseEmailChangeTemplate,
  supabaseInviteTemplate,
  supabaseMagicLinkTemplate,
  supabaseRecoveryTemplate,
} from '@/lib/email/templates/supabase-auth'
