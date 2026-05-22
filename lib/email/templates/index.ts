import { getAppUrl } from '@/lib/email/client'
import { baseEmailLayout, ctaButton, heading, infoBox, paragraph } from '@/lib/email/templates/layout'

export type WelcomeDirectorEmailData = {
  fullName: string
  schoolName: string
  organizationName: string
}

export function welcomeDirectorEmail(data: WelcomeDirectorEmailData) {
  const appUrl = getAppUrl()
  const subject = `Bienvenue sur EduNation — ${data.schoolName}`

  const html = baseEmailLayout(
    [
      heading(`Bienvenue, ${data.fullName} !`),
      paragraph(
        `Votre établissement <strong>${data.schoolName}</strong> a été inscrit sous le groupe <strong>${data.organizationName}</strong>. Votre espace directeur est prêt.`
      ),
      infoBox('Vous pouvez dès maintenant configurer vos classes, inviter votre personnel et commencer la gestion scolaire numérique.'),
      ctaButton('Accéder à mon tableau de bord', `${appUrl}/dashboard`),
      paragraph('Si vous n\'êtes pas à l\'origine de cette inscription, contactez immédiatement le support EduNation.'),
    ].join(''),
    `Votre établissement ${data.schoolName} est prêt sur EduNation.`
  )

  return { subject, html }
}

export type NotificationEmailData = {
  title: string
  body: string
  actionUrl?: string
  actionLabel?: string
}

export function notificationEmail(data: NotificationEmailData) {
  const subject = data.title

  const html = baseEmailLayout(
    [
      heading(data.title),
      paragraph(data.body),
      data.actionUrl
        ? ctaButton(data.actionLabel ?? 'Voir les détails', data.actionUrl)
        : '',
    ].join(''),
    data.body.slice(0, 120)
  )

  return { subject, html }
}

export type PaymentReceiptEmailData = {
  studentName: string
  amount: number
  currency: string
  reference: string
  schoolName: string
}

export function paymentReceiptEmail(data: PaymentReceiptEmailData) {
  const formatted = new Intl.NumberFormat('fr-FR').format(data.amount)
  const subject = `Reçu de paiement — ${data.reference}`

  const html = baseEmailLayout(
    [
      heading('Paiement enregistré'),
      paragraph(
        `Un paiement a été enregistré pour <strong>${data.studentName}</strong> à <strong>${data.schoolName}</strong>.`
      ),
      infoBox(
        `<strong>Montant :</strong> ${formatted} ${data.currency}<br />
         <strong>Référence :</strong> ${data.reference}`
      ),
      paragraph('Ce message confirme l\'enregistrement du paiement dans EduNation. Le reçu officiel est disponible depuis votre tableau de bord.'),
    ].join(''),
    `Paiement de ${formatted} ${data.currency} enregistré pour ${data.studentName}.`
  )

  return { subject, html }
}

export type AccountCreatedEmailData = {
  fullName: string
}

export function accountCreatedEmail(data: AccountCreatedEmailData) {
  const appUrl = getAppUrl()
  const subject = 'Votre compte directeur EduNation a été créé'

  const html = baseEmailLayout(
    [
      heading(`Bonjour ${data.fullName},`),
      paragraph(
        'Votre compte directeur a bien été créé. Il ne reste plus qu\'à configurer votre établissement pour commencer.'
      ),
      ctaButton('Continuer l\'inscription de mon école', `${appUrl}/register/school`),
      paragraph('Si vous n\'avez pas créé ce compte, ignorez cet email.'),
    ].join(''),
    'Finalisez l\'inscription de votre établissement sur EduNation.'
  )

  return { subject, html }
}
