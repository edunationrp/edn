/**
 * Génération et validation de l'IUN (Identifiant Unique National)
 * Format : BF-AAAA-XXXXXX-C
 * BF = pays, AAAA = année naissance, XXXXXX = séquence, C = chiffre contrôle Luhn
 */

export function luhnChecksum(number: string): number {
  const digits = number.replace(/\D/g, '').split('').map(Number)
  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i]
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }

  return sum % 10
}

export function luhnControlDigit(number: string): number {
  const checksum = luhnChecksum(number + '0')
  return checksum === 0 ? 0 : 10 - checksum
}

export function generateIUN(birthYear: number, sequence: number): string {
  const year = birthYear.toString().slice(-4)
  const seq = sequence.toString().padStart(6, '0')
  const rawNumber = `${year}${seq}`
  const control = luhnControlDigit(rawNumber)
  return `BF-${year}-${seq}-${control}`
}

export function validateIUN(iun: string): boolean {
  const parts = iun.split('-')
  if (parts.length !== 4) return false
  if (parts[0] !== 'BF') return false
  if (!/^\d{4}$/.test(parts[1])) return false
  if (!/^\d{6}$/.test(parts[2])) return false
  if (!/^\d$/.test(parts[3])) return false

  const rawNumber = `${parts[1]}${parts[2]}`
  const expectedControl = luhnControlDigit(rawNumber)
  return parseInt(parts[3]) === expectedControl
}

export function parseIUN(iun: string) {
  if (!validateIUN(iun)) return null
  const parts = iun.split('-')
  return {
    country: parts[0],
    birthYear: parseInt(parts[1]),
    sequence: parseInt(parts[2]),
    control: parseInt(parts[3]),
  }
}
