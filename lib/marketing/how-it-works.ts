export type HowItWorksStep = {
  id: string
  number: number
  title: string
  description: string
  accent: string
  ring: string
  badge: string
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: 'create',
    number: 1,
    title: 'Créez votre établissement',
    description:
      'Inscrivez votre école en quelques minutes et configurez vos informations de base : nom, adresse, contacts et année scolaire.',
    accent: 'bg-[#1a4d2e]',
    ring: 'ring-[#1a4d2e]/15',
    badge: 'bg-[#f0f9e8] text-[#1a4d2e]',
  },
  {
    id: 'users',
    number: 2,
    title: 'Ajoutez vos utilisateurs',
    description:
      'Invitez les enseignants, le personnel, les élèves et les parents — chacun accède à son espace selon son rôle.',
    accent: 'bg-[#0891b2]',
    ring: 'ring-[#0891b2]/15',
    badge: 'bg-cyan-50 text-cyan-800',
  },
  {
    id: 'manage',
    number: 3,
    title: 'Gérez votre établissement',
    description:
      'Notes, absences, finances, bulletins PDF et tableaux de bord : tous vos outils réunis dans une seule plateforme.',
    accent: 'bg-[#ea580c]',
    ring: 'ring-[#ea580c]/15',
    badge: 'bg-orange-50 text-orange-800',
  },
  {
    id: 'connect',
    number: 4,
    title: 'Restez connectés',
    description:
      'Parents et enseignants reçoivent des notifications en temps réel — notes publiées, absences, messages et paiements.',
    accent: 'bg-[#7c3aed]',
    ring: 'ring-[#7c3aed]/15',
    badge: 'bg-violet-50 text-violet-800',
  },
]
