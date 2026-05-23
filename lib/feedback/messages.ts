export type UserFeedback = {
  title: string
  description?: string
}

function extractMessage(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return ''
}

const EXACT_MESSAGES: Record<string, UserFeedback> = {
  'Invalid login credentials': {
    title: 'Connexion impossible',
    description: 'Email ou mot de passe incorrect. Vérifiez vos identifiants.',
  },
  'Email not confirmed': {
    title: 'Email non confirmé',
    description: 'Consultez votre boîte mail et cliquez sur le lien de confirmation.',
  },
  'User already registered': {
    title: 'Compte déjà existant',
    description: 'Cet email est déjà utilisé. Connectez-vous ou réinitialisez votre mot de passe.',
  },
  'Database error saving new user': {
    title: 'Inscription interrompue',
    description:
      'Impossible de créer votre profil. Vérifiez que les migrations Supabase sont appliquées, puis réessayez.',
  },
  'For security purposes, you can only request this after 60 seconds.': {
    title: 'Patientez un instant',
    description: 'Pour des raisons de sécurité, attendez 1 minute avant de renvoyer un email.',
  },
  'Password should be at least 6 characters': {
    title: 'Mot de passe trop court',
    description: 'Utilisez au moins 8 caractères pour sécuriser votre compte.',
  },
}

const PATTERN_MESSAGES: Array<{ test: RegExp; feedback: UserFeedback }> = [
  {
    test: /already registered|already been registered|user already exists/i,
    feedback: {
      title: 'Compte déjà existant',
      description: 'Cet email est déjà utilisé. Connectez-vous avec ce compte.',
    },
  },
  {
    test: /invalid email/i,
    feedback: {
      title: 'Email invalide',
      description: 'Vérifiez le format de votre adresse email.',
    },
  },
  {
    test: /network|fetch failed|failed to fetch/i,
    feedback: {
      title: 'Connexion interrompue',
      description: 'Vérifiez votre connexion internet et réessayez.',
    },
  },
  {
    test: /jwt expired|session expired|refresh token/i,
    feedback: {
      title: 'Session expirée',
      description: 'Reconnectez-vous pour continuer.',
    },
  },
  {
    test: /row-level security|permission denied|not authorized|42501/i,
    feedback: {
      title: 'Accès refusé',
      description: 'Vous n\'avez pas les droits pour effectuer cette action.',
    },
  },
  {
    test: /duplicate key|unique constraint/i,
    feedback: {
      title: 'Doublon détecté',
      description: 'Cette information existe déjà dans le système.',
    },
  },
  {
    test: /foreign key|violates foreign key/i,
    feedback: {
      title: 'Donnée liée manquante',
      description: 'Une information requise est absente ou incorrecte.',
    },
  },
  {
    test: /timeout|timed out/i,
    feedback: {
      title: 'Délai dépassé',
      description: 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants.',
    },
  },
]

const CONTEXT_FALLBACKS: Record<string, UserFeedback> = {
  auth_login: {
    title: 'Connexion échouée',
    description: 'Impossible de vous connecter pour le moment.',
  },
  auth_signup: {
    title: 'Inscription échouée',
    description: 'Impossible de créer votre compte pour le moment.',
  },
  auth_reset_password: {
    title: 'Envoi impossible',
    description: 'Le lien de réinitialisation n\'a pas pu être envoyé.',
  },
  onboarding_school: {
    title: 'Inscription école incomplète',
    description: 'Votre établissement n\'a pas pu être enregistré.',
  },
  grades_save: {
    title: 'Notes non enregistrées',
    description: 'La saisie des notes a échoué. Réessayez.',
  },
  grades_eval: {
    title: 'Évaluation non créée',
    description: 'Impossible de créer cette évaluation.',
  },
  payment_save: {
    title: 'Paiement non enregistré',
    description: 'Le paiement n\'a pas pu être enregistré.',
  },
  student_enroll: {
    title: 'Inscription élève échouée',
    description: 'L\'élève n\'a pas pu être inscrit.',
  },
  message_send: {
    title: 'Message non envoyé',
    description: 'Votre message n\'a pas pu être transmis.',
  },
  attendance_save: {
    title: 'Présences non enregistrées',
    description: 'La prise de présence a échoué.',
  },
  microphone: {
    title: 'Microphone inaccessible',
    description: 'Autorisez l\'accès au microphone dans votre navigateur.',
  },
}

export const TOAST_SUCCESS = {
  login: {
    title: 'Connexion réussie',
    description: 'Bienvenue sur EduNation.',
  },
  signupPendingEmail: {
    title: 'Inscription terminée',
    description: 'Consultez votre email et cliquez sur le lien de confirmation pour vous connecter.',
  },
  resetPasswordSent: {
    title: 'Email envoyé',
    description: 'Consultez votre boîte mail pour réinitialiser votre mot de passe.',
  },
  onboardingComplete: {
    title: 'Établissement créé',
    description: 'Votre école est prête. Bienvenue sur EduNation !',
  },
  gradesEvalCreated: {
    title: 'Évaluation créée',
    description: 'Vous pouvez maintenant saisir les notes.',
  },
  gradesSaved: (count: number) => ({
    title: count > 1 ? `${count} notes enregistrées` : 'Note enregistrée',
    description: 'Les notes ont été sauvegardées avec succès.',
  }),
  paymentSaved: (reference: string) => ({
    title: 'Paiement enregistré',
    description: `Référence : ${reference}`,
  }),
  studentEnrolled: (name: string) => ({
    title: 'Inscription enregistrée',
    description: `${name} est en attente de validation.`,
  }),
  messageSent: {
    title: 'Message envoyé',
    description: 'Votre message a bien été transmis.',
  },
  attendanceSaved: {
    title: 'Présences enregistrées',
    description: 'La prise de présence a été sauvegardée.',
  },
  copied: {
    title: 'Copié',
    description: 'Le contenu a été copié dans le presse-papiers.',
  },
  saved: {
    title: 'Enregistré',
    description: 'Vos modifications ont été sauvegardées.',
  },
} as const

export function toUserMessage(error: unknown, context?: string): UserFeedback {
  const raw = extractMessage(error).trim()

  if (raw && EXACT_MESSAGES[raw]) {
    return EXACT_MESSAGES[raw]
  }

  for (const { test, feedback } of PATTERN_MESSAGES) {
    if (raw && test.test(raw)) {
      return feedback
    }
  }

  if (context && CONTEXT_FALLBACKS[context]) {
    return {
      ...CONTEXT_FALLBACKS[context],
      description: raw
        ? `${CONTEXT_FALLBACKS[context].description} (${raw})`
        : CONTEXT_FALLBACKS[context].description,
    }
  }

  return {
    title: 'Une erreur est survenue',
    description: raw
      ? 'Détail : ' + raw
      : 'Réessayez dans quelques instants. Si le problème persiste, contactez le support.',
  }
}
