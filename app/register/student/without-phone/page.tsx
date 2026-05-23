import { StudentRegistrationWizard } from '@/features/register/student-registration-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription élève (sans téléphone) — EduNation',
}

export default function RegisterStudentWithoutPhonePage() {
  return <StudentRegistrationWizard mode="without-phone" />
}
