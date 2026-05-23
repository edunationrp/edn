/** Builds a minimal valid PDF with a title line (ASCII-safe). */
export function buildMinimalPdf(title: string): Uint8Array {
  const safeTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .slice(0, 80)

  const stream = `BT /F1 14 Tf 50 750 Td (${escapePdfString(safeTitle)}) Tj ET
BT /F1 11 Tf 50 720 Td (EduNation - Ressource pedagogique gratuite) Tj ET
BT /F1 10 Tf 50 690 Td (Document de demonstration - contenu complet bientot disponible) Tj ET`

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let body = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (const obj of objects) {
    offsets.push(body.length)
    body += obj
  }

  const xrefStart = body.length
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  body += `startxref\n${xrefStart}\n%%EOF`

  return new TextEncoder().encode(body)
}

function escapePdfString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}
