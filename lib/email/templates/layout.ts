import { getAppUrl } from '@/lib/email/client'
import { EMAIL_BRAND } from '@/lib/email/templates/brand'

type LayoutOptions = {
  previewText: string
  content: string
  showQuote?: boolean
}

export function baseEmailLayout({ previewText, content, showQuote = true }: LayoutOptions) {
  const appUrl = getAppUrl()
  const displayUrl = appUrl.replace(/^https?:\/\//, '')

  const quote = showQuote
    ? `
      <tr>
        <td style="padding:0 28px 8px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.textMuted};font-style:italic;text-align:center;">
            « ${EMAIL_BRAND.tagline} »
          </p>
        </td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${EMAIL_BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};font-family:'Segoe UI',Inter,Arial,sans-serif;color:${EMAIL_BRAND.text};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${EMAIL_BRAND.bg};padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">
          <tr>
            <td style="padding:0 0 14px;text-align:center;">
              <span style="font-size:11px;font-weight:700;color:${EMAIL_BRAND.textMuted};letter-spacing:0.14em;text-transform:uppercase;">
                ${EMAIL_BRAND.motto}
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:${EMAIL_BRAND.white};border-radius:20px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};box-shadow:0 18px 40px rgba(27,58,107,0.08);">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:28px 28px 24px;background:linear-gradient(135deg, ${EMAIL_BRAND.blueDark} 0%, ${EMAIL_BRAND.blue} 55%, #24508f 100%);">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td>
                          <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;line-height:1;">
                            Edu<span style="color:${EMAIL_BRAND.accent};">Nation</span>
                          </div>
                          <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.82);line-height:1.5;">
                            La plateforme qui accompagne la réussite scolaire
                          </div>
                        </td>
                        <td align="right" style="vertical-align:top;">
                          <div style="width:44px;height:44px;line-height:44px;text-align:center;border-radius:14px;background:rgba(255,255,255,0.12);font-size:22px;">
                            🎓
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 28px 12px;">
                    ${content}
                  </td>
                </tr>
                ${quote}
                <tr>
                  <td style="padding:18px 28px 24px;background:#fafbfd;border-top:1px solid ${EMAIL_BRAND.border};">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.textMuted};text-align:center;">
                      Cet email a été envoyé automatiquement par <strong style="color:${EMAIL_BRAND.text};">${EMAIL_BRAND.name}</strong>.
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.textMuted};text-align:center;">
                      <a href="${appUrl}" style="color:${EMAIL_BRAND.green};font-weight:600;text-decoration:none;">${displayUrl}</a>
                      · Conçu pour les établissements du Burkina Faso
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 0;text-align:center;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
                Vous recevez cet email car vous utilisez EduNation ou avez créé un compte directeur.
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

/** Layout statique pour les templates Supabase Auth (sans getAppUrl côté serveur app). */
export function supabaseAuthEmailLayout({
  previewText,
  content,
  siteUrl = '{{ .SiteURL }}',
}: {
  previewText: string
  content: string
  siteUrl?: string
}) {
  const displayUrl = siteUrl.replace(/^https?:\/\//, '')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${EMAIL_BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};font-family:'Segoe UI',Inter,Arial,sans-serif;color:${EMAIL_BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.bg};padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${EMAIL_BRAND.white};border-radius:20px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};box-shadow:0 18px 40px rgba(27,58,107,0.08);">
          <tr>
            <td style="padding:28px;background:linear-gradient(135deg, ${EMAIL_BRAND.blueDark} 0%, ${EMAIL_BRAND.blue} 100%);">
              <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">
                Edu<span style="color:${EMAIL_BRAND.accent};">Nation</span>
              </div>
              <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.82);">
                Accompagner chaque apprenant vers l'excellence
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;background:#fafbfd;border-top:1px solid ${EMAIL_BRAND.border};">
              <p style="margin:0;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.textMuted};text-align:center;">
                ${EMAIL_BRAND.name} · <a href="${siteUrl}" style="color:${EMAIL_BRAND.green};text-decoration:none;">${displayUrl}</a>
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
