import { SchoolRegistrationWizard } from '@/features/auth/school-registration-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscrire mon école — EduNation',
  description: 'Créez votre compte directeur et inscrivez votre établissement sur EduNation.',
}

export default function RegisterSchoolPage() {
  return <SchoolRegistrationWizard />
}
