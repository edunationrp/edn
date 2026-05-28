export async function hashVerificationCode(code: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code.trim()))
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
