/**
 * Vérifie les variables requises lors d'un déploiement Vercel.
 * Ignoré en local sauf si FORCE_ENV_CHECK=1
 */
const isVercel = process.env.VERCEL === '1'
const forceCheck = process.env.FORCE_ENV_CHECK === '1'

if (!isVercel && !forceCheck) {
  process.exit(0)
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const recommended = [
  'NEXT_PUBLIC_APP_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM',
]

const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('\n[EduNation] Variables d\'environnement manquantes sur Vercel :\n')
  missing.forEach(key => console.error(`  - ${key}`))
  console.error('\nConfigurez-les dans Vercel > Project > Settings > Environment Variables\n')
  process.exit(1)
}

const missingRecommended = recommended.filter(key => !process.env[key])
if (missingRecommended.length > 0) {
  console.warn('\n[EduNation] Variables recommandées absentes :\n')
  missingRecommended.forEach(key => console.warn(`  - ${key}`))
  console.warn('')
}

console.log('[EduNation] Variables de production OK')
