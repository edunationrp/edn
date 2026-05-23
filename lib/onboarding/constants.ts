export const COUNTRIES = [
  { code: 'BF', label: 'Burkina Faso' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'ML', label: 'Mali' },
  { code: 'SN', label: 'Sénégal' },
  { code: 'NE', label: 'Niger' },
  { code: 'TG', label: 'Togo' },
  { code: 'BJ', label: 'Bénin' },
  { code: 'GN', label: 'Guinée' },
  { code: 'FR', label: 'France' },
] as const

export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'mo', label: 'Mooré' },
  { code: 'dy', label: 'Dioula' },
  { code: 'ff', label: 'Fulfuldé' },
  { code: 'en', label: 'English' },
] as const

export const CURRENCIES = [
  { code: 'XOF', label: 'Franc CFA (XOF)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'Dollar US (USD)' },
] as const

export const SCHOOL_TYPES = [
  { value: 'primaire', label: 'Primaire' },
  { value: 'secondaire', label: 'Secondaire' },
  { value: 'lycee', label: 'Lycée' },
  { value: 'universite', label: 'Université' },
  { value: 'formation', label: 'Centre de formation' },
] as const

export const EVALUATION_SYSTEMS = [
  { value: 'sur_10', label: 'Sur 10' },
  { value: 'sur_20', label: 'Sur 20' },
  { value: 'lettres', label: 'Lettres (A, B, C…)' },
  { value: 'autre', label: 'Autre' },
] as const

export const ACADEMIC_FORMATS = [
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
  { value: 'annuel', label: 'Annuel' },
] as const

export const ACCESS_LEVELS = [
  { value: 'public', label: 'Public' },
  { value: 'prive', label: 'Privé' },
] as const

export const SUBSCRIPTION_PLANS = {
  starter: {
    code: 'starter',
    label: 'Starter',
    maxSchools: 3,
    description: 'Idéal pour démarrer avec jusqu\'à 3 établissements',
  },
} as const

export function getDefaultSchoolYearLabel() {
  const now = new Date()
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${year} — ${year + 1}`
}

export function parseSchoolYearDates(label: string) {
  const match = label.match(/(\d{4})\s*[-–—]\s*(\d{4})/)
  if (!match) {
    const year = new Date().getFullYear()
    return {
      name: `${year} — ${year + 1}`,
      start_date: `${year}-09-01`,
      end_date: `${year + 1}-07-31`,
    }
  }
  const startYear = Number(match[1])
  const endYear = Number(match[2])
  return {
    name: `${startYear} — ${endYear}`,
    start_date: `${startYear}-09-01`,
    end_date: `${endYear}-07-31`,
  }
}

export function getCountryLabel(code: string) {
  return COUNTRIES.find(c => c.code === code)?.label ?? code
}

export function buildOnboardingSchoolPayload(
  wizard: {
    school_name: string
    school_type: 'primaire' | 'secondaire' | 'lycee' | 'universite' | 'formation'
    country: string
    city: string
    address: string
    phone?: string
    email?: string
  },
  options?: { preferredLanguage?: string }
) {
  const schoolName = wizard.school_name.trim()

  return {
    organization_name: schoolName,
    school_name: schoolName,
    school_type: wizard.school_type,
    country: wizard.country,
    city: wizard.city.trim(),
    address: wizard.address.trim(),
    phone: wizard.phone?.trim() || undefined,
    email: wizard.email?.trim() || undefined,
    currency: 'XOF',
    school_year: getDefaultSchoolYearLabel(),
    evaluation_system: 'sur_20' as const,
    main_language: options?.preferredLanguage ?? 'fr',
    estimated_students: undefined,
    access_level: 'prive' as const,
    structure_name: schoolName,
    academic_format: 'trimestre' as const,
  }
}
