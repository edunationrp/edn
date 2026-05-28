const PARENT_CODE_REGEX = /^E0\d{10}$/

export function isValidParentCode(value: string): boolean {
  return PARENT_CODE_REGEX.test(value.trim().toUpperCase())
}

export function normalizeParentCode(value: string): string {
  return value.trim().toUpperCase()
}

export function parentCodeToAuthEmail(parentCode: string): string {
  return `parent-${normalizeParentCode(parentCode).toLowerCase()}@parents.edunation.bf`
}

export function generateParentCode(): string {
  let code = ''
  for (let i = 0; i < 10; i += 1) {
    code += String(Math.floor(Math.random() * 10))
  }
  return `E0${code}`
}

export function generateParentPassword(length = 10): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = letters + digits

  const chars: string[] = [
    letters[Math.floor(Math.random() * letters.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ]

  while (chars.length < length) {
    chars.push(all[Math.floor(Math.random() * all.length)])
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}
