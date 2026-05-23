/**
 * URL publique de l'application (emails, redirects, liens absolus).
 *
 * Priorité :
 * 1. NEXT_PUBLIC_APP_URL (sauf localhost en prod Vercel — config erronée fréquente)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (prod Vercel)
 * 3. VERCEL_URL (preview / prod)
 * 4. localhost
 */
function isLocalhostUrl(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)
}

export function getPublicAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const onVercel = process.env.VERCEL === '1'
  const isProduction = process.env.VERCEL_ENV === 'production'

  if (fromEnv && !(onVercel && isProduction && isLocalhostUrl(fromEnv))) {
    return fromEnv
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, '')
  if (onVercel && isProduction && productionHost) {
    return productionHost.startsWith('http') ? productionHost : `https://${productionHost}`
  }

  const vercelHost = process.env.VERCEL_URL?.replace(/\/$/, '')
  if (onVercel && vercelHost) {
    return vercelHost.startsWith('http') ? vercelHost : `https://${vercelHost}`
  }

  if (fromEnv) {
    return fromEnv
  }

  return 'http://localhost:3000'
}

/** Origin explicite (ex. window.location.origin) avec repli sur getPublicAppUrl(). */
export function resolveAppUrl(explicitOrigin?: string) {
  const candidate = explicitOrigin?.replace(/\/$/, '')
  if (candidate && (!isLocalhostUrl(candidate) || process.env.NODE_ENV !== 'production')) {
    return candidate
  }
  return getPublicAppUrl()
}
