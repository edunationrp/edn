import { getAppUrl } from '@/lib/email/client'
import { EMAIL_BRAND, EMAIL_SUPPORT, TRIAL_PERIOD_DAYS } from '@/lib/email/templates/brand'
import {
  badge,
  ctaButton,
  divider,
  escapeHtml,
  featureRow,
  heading,
  infoBox,
  paragraph,
  quoteBlock,
  secondaryLink,
  signatureBlock,
  stepsList,
  supportLine,
  trialProgress,
} from '@/lib/email/templates/components'
import { baseEmailLayout } from '@/lib/email/templates/layout'

export type WelcomeDirectorEmailData = {
  fullName: string
  schoolName: string
  organizationName: string
}

export function welcomeDirectorEmail(data: WelcomeDirectorEmailData) {
  const appUrl = getAppUrl()
  const fullName = escapeHtml(data.fullName)
  const schoolName = escapeHtml(data.schoolName)
  const organizationName = escapeHtml(data.organizationName)
  const subject = `Bienvenue sur EduNation — ${data.schoolName} est prêt`

  const html = baseEmailLayout({
    previewText: `Votre établissement ${data.schoolName} est inscrit. Commencez à digitaliser votre école dès aujourd'hui.`,
    content: [
      badge('Inscription confirmée'),
      heading(`Félicitations, ${fullName} !`, 'Votre établissement entre dans l\'ère du numérique éducatif.'),
      paragraph(
        `Nous sommes honorés d'accueillir <strong>${schoolName}</strong> au sein du groupe <strong>${organizationName}</strong>. Votre espace directeur est configuré et prêt à accueillir vos premières classes.`
      ),
      trialProgress(TRIAL_PERIOD_DAYS, TRIAL_PERIOD_DAYS),
      infoBox(
        `<strong>Votre essai gratuit de ${TRIAL_PERIOD_DAYS} jours est activé.</strong><br />
         Explorez toutes les fonctionnalités : élèves, notes, bulletins, finances et notifications — sans engagement.`,
        'info'
      ),
      featureRow([
        { emoji: '👨‍🎓', title: 'Élèves', description: 'Inscriptions et dossiers scolaires' },
        { emoji: '📊', title: 'Notes', description: 'Bulletins PDF automatiques' },
        { emoji: '💬', title: 'Parents', description: 'Notifications en temps réel' },
      ]),
      stepsList([
        {
          title: 'Configurez votre année scolaire',
          description: 'Classes, matières et structure académique.',
        },
        {
          title: 'Invitez votre équipe',
          description: 'Professeurs, secrétaires et personnel administratif.',
        },
        {
          title: 'Inscrivez vos premiers élèves',
          description: 'Centralisez les données de votre établissement.',
        },
      ]),
      ctaButton('Accéder à mon tableau de bord', `${appUrl}/dashboard`),
      secondaryLink('Besoin d\'aide pour démarrer ?', `mailto:${EMAIL_SUPPORT}`),
      quoteBlock(
        'L\'éducation est le socle sur lequel se construisent les générations capables d\'innover et de transformer le monde.',
        'EduNation'
      ),
      signatureBlock(),
    ].join(''),
  })

  return { subject, html }
}

export type AccountCreatedEmailData = {
  fullName: string
}

export function accountCreatedEmail(data: AccountCreatedEmailData) {
  const appUrl = getAppUrl()
  const fullName = escapeHtml(data.fullName)
  const subject = 'Confirmez votre email — EduNation vous attend'

  const html = baseEmailLayout({
    previewText: 'Plus qu\'une étape : confirmez votre adresse email pour inscrire votre établissement.',
    content: [
      badge('Étape 1 sur 2'),
      heading(`Bonjour ${fullName},`, 'Merci de rejoindre la communauté EduNation.'),
      paragraph(
        'Vous venez de créer votre compte directeur. Avant de configurer votre établissement, nous devons vérifier votre adresse email — une mesure essentielle pour protéger les données scolaires.'
      ),
      infoBox(
        '<strong>Vérifiez votre boîte de réception</strong><br />Un second email de confirmation vient de vous être envoyé. Cliquez sur le lien pour activer votre compte, puis revenez finaliser l\'inscription de votre école.',
        'info'
      ),
      stepsList([
        {
          title: 'Confirmer votre email',
          description: 'Ouvrez l\'email « Confirmez votre adresse » et cliquez sur le bouton.',
        },
        {
          title: 'Configurer votre établissement',
          description: 'Renseignez les informations de votre école en quelques minutes.',
        },
      ]),
      ctaButton('Continuer l\'inscription', `${appUrl}/register/school`),
      divider(),
      paragraph(
        '<strong>Email non reçu ?</strong> Vérifiez vos spams ou attendez 1 minute avant de demander un renvoi depuis la page d\'inscription.'
      ),
      supportLine(),
      signatureBlock(),
    ].join(''),
    showQuote: false,
  })

  return { subject, html }
}

export type TrialReminderEmailData = {
  fullName: string
  schoolName: string
  daysLeft: number
}

export function trialReminderEmail(data: TrialReminderEmailData) {
  const appUrl = getAppUrl()
  const fullName = escapeHtml(data.fullName)
  const schoolName = escapeHtml(data.schoolName)
  const daysLeft = Math.max(0, data.daysLeft)
  const subject =
    daysLeft <= 2
      ? `⏳ Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'essai — ${data.schoolName}`
      : `Votre essai EduNation — ${daysLeft} jours restants`

  const html = baseEmailLayout({
    previewText: `Il vous reste ${daysLeft} jours pour profiter de votre essai EduNation avec ${data.schoolName}.`,
    content: [
      badge(daysLeft <= 2 ? 'Essai bientôt terminé' : 'Rappel période d\'essai'),
      heading(
        daysLeft <= 2 ? 'Votre essai touche à sa fin' : 'Continuez à transformer votre établissement',
        `${fullName}, votre parcours avec ${schoolName} avance bien.`
      ),
      trialProgress(daysLeft, TRIAL_PERIOD_DAYS),
      paragraph(
        daysLeft <= 2
          ? 'Votre période d\'essai se termine très bientôt. Assurez-vous d\'avoir exploré les modules essentiels : notes, bulletins, présences et finances.'
          : 'Profitez de ces jours restants pour inviter votre équipe, inscrire vos élèves et tester la génération de bulletins.'
      ),
      featureRow([
        { emoji: '📝', title: 'Notes', description: 'Saisie et calcul automatique' },
        { emoji: '📋', title: 'Bulletins', description: 'PDF avec QR code' },
        { emoji: '🔔', title: 'Alertes', description: 'Parents informés en direct' },
      ]),
      ctaButton('Ouvrir mon tableau de bord', `${appUrl}/dashboard`),
      infoBox(
        'Besoin de plus de temps ou d\'une démonstration personnalisée ? Répondez à cet email, notre équipe pédagogique vous accompagne.',
        daysLeft <= 2 ? 'warning' : 'info'
      ),
      signatureBlock(),
    ].join(''),
  })

  return { subject, html }
}

export type TrialEndedEmailData = {
  fullName: string
  schoolName: string
}

export function trialEndedEmail(data: TrialEndedEmailData) {
  const appUrl = getAppUrl()
  const fullName = escapeHtml(data.fullName)
  const schoolName = escapeHtml(data.schoolName)
  const subject = `Votre essai EduNation est terminé — ${data.schoolName}`

  const html = baseEmailLayout({
    previewText: `La période d'essai de ${data.schoolName} est terminée. Passez à l'abonnement pour continuer.`,
    content: [
      badge('Fin de période d\'essai'),
      heading(`Bonjour ${fullName},`, `Votre essai gratuit pour ${schoolName} est arrivé à son terme.`),
      paragraph(
        'Nous espérons qu\'EduNation vous a aidé à mieux organiser la vie scolaire de votre établissement. Vos données sont conservées en sécurité — activez votre abonnement pour retrouver l\'accès complet.'
      ),
      infoBox(
        '<strong>Plan Starter</strong> — Jusqu\'à 3 établissements · Notes & bulletins · Finances · Notifications parents',
        'info'
      ),
      ctaButton('Activer mon abonnement', `${appUrl}/dashboard`),
      secondaryLink('Contacter l\'équipe commerciale', `mailto:${EMAIL_SUPPORT}`),
      quoteBlock(
        'Former aujourd\'hui les leaders de demain, c\'est choisir des outils à la hauteur de votre mission éducative.',
        'EduNation'
      ),
      signatureBlock(),
    ].join(''),
  })

  return { subject, html }
}

export type NotificationEmailData = {
  title: string
  body: string
  actionUrl?: string
  actionLabel?: string
}

export function notificationEmail(data: NotificationEmailData) {
  const title = escapeHtml(data.title)
  const body = escapeHtml(data.body)
  const subject = data.title

  const html = baseEmailLayout({
    previewText: data.body.slice(0, 140),
    content: [
      badge('Notification'),
      heading(title),
      paragraph(body),
      data.actionUrl ? ctaButton(data.actionLabel ?? 'Voir les détails', data.actionUrl) : '',
      signatureBlock(),
    ].join(''),
    showQuote: false,
  })

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
  const studentName = escapeHtml(data.studentName)
  const schoolName = escapeHtml(data.schoolName)
  const reference = escapeHtml(data.reference)
  const subject = `Reçu de paiement — ${data.reference}`

  const html = baseEmailLayout({
    previewText: `Paiement de ${formatted} ${data.currency} enregistré pour ${data.studentName}.`,
    content: [
      badge('Paiement confirmé'),
      heading('Reçu de paiement enregistré', 'Transaction sécurisée via EduNation.'),
      paragraph(
        `Un paiement a été enregistré pour l'élève <strong>${studentName}</strong> à l'établissement <strong>${schoolName}</strong>.`
      ),
      infoBox(
        `<table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 0;"><strong>Montant :</strong></td><td align="right">${formatted} ${escapeHtml(data.currency)}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Référence :</strong></td><td align="right">${reference}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Statut :</strong></td><td align="right" style="color:#166534;font-weight:700;">Confirmé ✓</td></tr>
        </table>`,
        'success'
      ),
      paragraph(
        'Ce message confirme l\'enregistrement du paiement. Le reçu officiel PDF est disponible depuis votre tableau de bord financier.'
      ),
      signatureBlock(),
    ].join(''),
    showQuote: false,
  })

  return { subject, html }
}

export type StaffInviteEmailData = {
  inviterName: string
  schoolName: string
  roleLabel: string
  inviteUrl: string
}

export function staffInviteEmail(data: StaffInviteEmailData) {
  const inviterName = escapeHtml(data.inviterName)
  const schoolName = escapeHtml(data.schoolName)
  const roleLabel = escapeHtml(data.roleLabel)
  const subject = `Invitation à rejoindre ${data.schoolName} sur EduNation`

  const html = baseEmailLayout({
    previewText: `${data.inviterName} vous invite à rejoindre ${data.schoolName} en tant que ${data.roleLabel}.`,
    content: [
      badge('Invitation personnel'),
      heading('Vous êtes invité(e) à rejoindre une équipe', 'Une nouvelle aventure éducative vous attend.'),
      paragraph(
        `<strong>${inviterName}</strong> vous invite à rejoindre l'établissement <strong>${schoolName}</strong> en tant que <strong>${roleLabel}</strong> sur EduNation.`
      ),
      infoBox(
        'En acceptant, vous accéderez à votre espace sécurisé pour collaborer sur la gestion scolaire : notes, présences, communication et plus encore.',
        'info'
      ),
      ctaButton('Accepter l\'invitation', data.inviteUrl),
      paragraph('Ce lien est personnel et sécurisé. Ne le partagez pas.'),
      signatureBlock(),
    ].join(''),
  })

  return { subject, html }
}
