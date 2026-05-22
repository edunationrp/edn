import { getAppUrl } from '@/lib/email/client'

const BRAND = {
  name: 'EduNation',
  green: '#1a4d2e',
  blue: '#1B3A6B',
  accent: '#7AB832',
  muted: '#6B7280',
}

export function baseEmailLayout(content: string, previewText: string) {
  const appUrl = getAppUrl()

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EduNation</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Inter,Arial,sans-serif;color:#111827;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:${BRAND.blue};padding:24px 28px;">
              <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                Edu<span style="color:${BRAND.accent};">Nation</span>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:0.12em;text-transform:uppercase;">
                Éduquer · Gérer · Connecter
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};line-height:1.6;">
                Cet email a été envoyé automatiquement par EduNation.<br />
                Plateforme scolaire numérique — Burkina Faso · <a href="${appUrl}" style="color:${BRAND.green};">${appUrl.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function ctaButton(label: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:10px;background:${BRAND.green};">
        <a href="${href}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">${text}</p>`
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">${text}</h1>`
}

export function infoBox(text: string) {
  return `<div style="margin:16px 0;padding:14px 16px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:10px;font-size:14px;color:#166534;line-height:1.6;">${text}</div>`
}
