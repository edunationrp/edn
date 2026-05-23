import { StudentRegistrationWizard } from '@/features/register/student-registration-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription élève (avec téléphone) — EduNation',
}

export default function RegisterStudentWithPhonePage() {
  return <StudentRegistrationWizard mode="with-phone" />
}
