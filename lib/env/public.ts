/**
 * URL publique de l'application (emails, redirects, liens absolus).
 * Priorité : NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
 */
export function getPublicAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}
