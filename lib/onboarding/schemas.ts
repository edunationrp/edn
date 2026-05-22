import { z } from 'zod'

export const directorAccountSchema = z
  .object({
    full_name: z.string().min(3, 'Nom complet requis (min. 3 caractères)'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(8, 'Numéro de téléphone requis pour la sécurité'),
    password: z.string().min(8, 'Mot de passe requis (min. 8 caractères)'),
    confirm_password: z.string(),
    country: z.string().min(2, 'Pays requis'),
    preferred_language: z.string().optional(),
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  })

export const organizationSchema = z.object({
  organization_name: z.string().min(2, 'Nom du groupe / organisation requis'),
})

export const schoolIdentitySchema = z.object({
  school_name: z.string().min(2, 'Nom de l\'école requis'),
  school_type: z.enum(['primaire', 'secondaire', 'lycee', 'universite', 'formation']),
  country: z.string().min(2, 'Pays requis'),
  city: z.string().min(2, 'Ville requise'),
  address: z.string().min(5, 'Adresse complète requise'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
})

export const schoolSettingsSchema = z.object({
  currency: z.string().min(3, 'Devise requise'),
  school_year: z.string().min(9, 'Année scolaire requise (ex: 2025 — 2026)'),
  evaluation_system: z.enum(['sur_10', 'sur_20', 'lettres', 'autre']),
  main_language: z.string().min(2, 'Langue principale requise'),
    estimated_students: z
      .union([z.literal(''), z.coerce.number().int().min(0)])
      .optional()
      .transform(val => (val === '' || val === undefined ? undefined : Number(val))),
  access_level: z.enum(['public', 'prive']),
})

export const schoolStructureSchema = z.object({
  structure_name: z.string().min(2, 'Nom de la structure requis'),
  academic_format: z.enum(['trimestre', 'semestre', 'annuel']),
})

export type DirectorAccountValues = z.infer<typeof directorAccountSchema>
export type OrganizationValues = z.infer<typeof organizationSchema>
export type SchoolIdentityValues = z.infer<typeof schoolIdentitySchema>
export type SchoolSettingsValues = z.infer<typeof schoolSettingsSchema>
export type SchoolStructureValues = z.infer<typeof schoolStructureSchema>

export type OnboardingSchoolPayload = OrganizationValues &
  SchoolIdentityValues &
  SchoolSettingsValues &
  SchoolStructureValues
