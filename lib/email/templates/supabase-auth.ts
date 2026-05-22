import {
  badge,
  ctaButton,
  divider,
  heading,
  infoBox,
  linkFallback,
  otpBox,
  paragraph,
  signatureBlock,
  supportLine,
} from '@/lib/email/templates/components'
import { supabaseAuthEmailLayout } from '@/lib/email/templates/layout'

const CONFIRM_URL = '{{ .ConfirmationURL }}'
const SITE_URL = '{{ .SiteURL }}'
const EMAIL = '{{ .Email }}'
const TOKEN = '{{ .Token }}'

export function supabaseConfirmSignupTemplate() {
  return {
    subject: 'Confirmez votre adresse email — EduNation',
    html: supabaseAuthEmailLayout({
      previewText: 'Activez votre compte directeur EduNation en un clic.',
      siteUrl: SITE_URL,
      content: [
        badge('Confirmation requise'),
        heading('Bienvenue dans EduNation', 'Une dernière étape pour sécuriser votre compte.'),
        paragraph(
          `Merci de votre confiance. Pour protéger les données de votre futur établissement, confirmez que <strong>${EMAIL}</strong> est bien votre adresse email.`
        ),
        infoBox(
          '<strong>Pourquoi cette étape ?</strong><br />La confirmation garantit que seul vous pouvez accéder au tableau de bord directeur et aux informations scolaires sensibles.',
          'info'
        ),
        ctaButton('Confirmer mon adresse email', CONFIRM_URL),
        linkFallback(CONFIRM_URL),
        divider(),
        paragraph('Vous préférez un code ? Utilisez celui-ci sur la page de vérification :'),
        otpBox(TOKEN),
        paragraph('Si vous n\'avez pas créé de compte EduNation, ignorez cet email en toute sécurité.'),
        supportLine(),
        signatureBlock(),
      ].join(''),
    }),
  }
}

export function supabaseRecoveryTemplate() {
  return {
    subject: 'Réinitialisez votre mot de passe — EduNation',
    html: supabaseAuthEmailLayout({
      previewText: 'Demande de réinitialisation de mot de passe pour votre compte EduNation.',
      siteUrl: SITE_URL,
      content: [
        badge('Sécurité du compte'),
        heading('Mot de passe oublié ?', 'Pas de souci — nous sommes là pour vous aider.'),
        paragraph(
          'Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte EduNation. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.'
        ),
        infoBox(
          '<strong>Ce lien expire dans 1 heure.</strong> Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email — votre mot de passe actuel reste inchangé.',
          'warning'
        ),
        ctaButton('Réinitialiser mon mot de passe', CONFIRM_URL),
        linkFallback(CONFIRM_URL),
        divider(),
        paragraph('Alternative : entrez ce code de vérification sur la page de connexion :'),
        otpBox(TOKEN),
        supportLine(),
        signatureBlock(),
      ].join(''),
    }),
  }
}

export function supabaseMagicLinkTemplate() {
  return {
    subject: 'Votre lien de connexion — EduNation',
    html: supabaseAuthEmailLayout({
      previewText: 'Connectez-vous à EduNation en un clic, sans mot de passe.',
      siteUrl: SITE_URL,
      content: [
        badge('Connexion sécurisée'),
        heading('Connectez-vous à EduNation', 'Votre lien de connexion personnel est prêt.'),
        paragraph(
          'Cliquez sur le bouton ci-dessous pour accéder à votre espace. Ce lien est à usage unique et expire rapidement pour votre sécurité.'
        ),
        ctaButton('Se connecter à EduNation', CONFIRM_URL),
        linkFallback(CONFIRM_URL),
        divider(),
        paragraph('Code alternatif :'),
        otpBox(TOKEN),
        paragraph('Si vous n\'avez pas demandé ce lien, vous pouvez ignorer cet email.'),
        signatureBlock(),
      ].join(''),
    }),
  }
}

export function supabaseInviteTemplate() {
  return {
    subject: 'Vous êtes invité(e) sur EduNation',
    html: supabaseAuthEmailLayout({
      previewText: 'Acceptez votre invitation pour rejoindre EduNation.',
      siteUrl: SITE_URL,
      content: [
        badge('Invitation'),
        heading('Rejoignez EduNation', 'Vous avez été invité(e) à participer à la gestion scolaire numérique.'),
        paragraph(
          'Un administrateur vous a invité à créer votre compte EduNation. Acceptez l\'invitation pour accéder à votre espace de travail sécurisé.'
        ),
        ctaButton('Accepter l\'invitation', CONFIRM_URL),
        linkFallback(CONFIRM_URL),
        signatureBlock(),
      ].join(''),
    }),
  }
}

export function supabaseEmailChangeTemplate() {
  return {
    subject: 'Confirmez votre nouvelle adresse email — EduNation',
    html: supabaseAuthEmailLayout({
      previewText: 'Confirmez le changement d\'adresse email de votre compte EduNation.',
      siteUrl: SITE_URL,
      content: [
        badge('Modification email'),
        heading('Confirmez votre nouvelle adresse', 'Sécurisez la mise à jour de votre compte.'),
        paragraph(
          `Vous avez demandé à modifier l'adresse email associée à votre compte EduNation. Confirmez <strong>${EMAIL}</strong> pour finaliser le changement.`
        ),
        ctaButton('Confirmer la nouvelle adresse', CONFIRM_URL),
        linkFallback(CONFIRM_URL),
        paragraph('Si vous n\'êtes pas à l\'origine de cette modification, contactez-nous immédiatement.'),
        supportLine(),
        signatureBlock(),
      ].join(''),
    }),
  }
}

export const SUPABASE_AUTH_TEMPLATES = {
  confirmation: supabaseConfirmSignupTemplate(),
  recovery: supabaseRecoveryTemplate(),
  magicLink: supabaseMagicLinkTemplate(),
  invite: supabaseInviteTemplate(),
  emailChange: supabaseEmailChangeTemplate(),
} as const
