/**
 * Montants FCFA — toujours des entiers (pas de centimes).
 * Évite les dérives du type 15000 → 14987 via float IEEE.
 */

export function toMoney(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0
    return Math.round(value)
  }
  const cleaned = String(value).trim().replace(/\s/g, '').replace(',', '.')
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed)
}

export function parseMoneyInput(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(/[^\d]/g, '')
  if (!cleaned) return 0
  return parseInt(cleaned, 10)
}

export function sumMoney(values: Iterable<number>): number {
  let total = 0
  for (const v of values) {
    total += toMoney(v)
  }
  return total
}

export function formatMoneyAmount(amount: unknown, currency = 'FCFA'): string {
  const whole = toMoney(amount)
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(whole)} ${currency}`
}
