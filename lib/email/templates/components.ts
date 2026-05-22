import { EMAIL_BRAND, EMAIL_SUPPORT } from '@/lib/email/templates/brand'

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function heading(text: string, subtitle?: string) {
  return `
    <h1 style="margin:0 0 ${subtitle ? '8px' : '16px'};font-size:26px;line-height:1.25;font-weight:800;color:${EMAIL_BRAND.text};letter-spacing:-0.02em;">
      ${text}
    </h1>
    ${
      subtitle
        ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textMuted};">${subtitle}</p>`
        : ''
    }`
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:${EMAIL_BRAND.textBody};">${text}</p>`
}

export function badge(label: string) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
      <tr>
        <td style="padding:6px 12px;background:${EMAIL_BRAND.accentSoft};border:1px solid #d9f0c0;border-radius:999px;font-size:11px;font-weight:700;color:${EMAIL_BRAND.green};letter-spacing:0.08em;text-transform:uppercase;">
          ${label}
        </td>
      </tr>
    </table>`
}

export function ctaButton(label: string, href: string) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
      <tr>
        <td align="center" style="border-radius:12px;background:linear-gradient(135deg, ${EMAIL_BRAND.green} 0%, #236b42 100%);box-shadow:0 8px 20px rgba(26,77,46,0.22);">
          <a href="${href}" style="display:inline-block;padding:15px 28px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

export function secondaryLink(label: string, href: string) {
  return `
    <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.textMuted};text-align:center;">
      <a href="${href}" style="color:${EMAIL_BRAND.blue};font-weight:600;text-decoration:underline;">${label}</a>
    </p>`
}

export function infoBox(content: string, tone: 'success' | 'info' | 'warning' = 'success') {
  const styles = {
    success: { bg: '#ecfdf5', border: '#bbf7d0', text: '#166534' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  }[tone]

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="padding:16px 18px;background:${styles.bg};border:1px solid ${styles.border};border-left:4px solid ${EMAIL_BRAND.accent};border-radius:12px;font-size:14px;line-height:1.7;color:${styles.text};">
          ${content}
        </td>
      </tr>
    </table>`
}

export function highlightCard(title: string, description: string, emoji: string) {
  return `
    <td width="33%" style="padding:6px;vertical-align:top;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px 12px;background:#f9fafb;border:1px solid ${EMAIL_BRAND.border};border-radius:12px;text-align:center;">
            <div style="font-size:22px;line-height:1;margin-bottom:8px;">${emoji}</div>
            <div style="font-size:13px;font-weight:700;color:${EMAIL_BRAND.text};margin-bottom:4px;">${title}</div>
            <div style="font-size:12px;line-height:1.5;color:${EMAIL_BRAND.textMuted};">${description}</div>
          </td>
        </tr>
      </table>
    </td>`
}

export function featureRow(items: { emoji: string; title: string; description: string }[]) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;">
      <tr>
        ${items.map(item => highlightCard(item.title, item.description, item.emoji)).join('')}
      </tr>
    </table>`
}

export function stepsList(steps: { title: string; description: string }[]) {
  const rows = steps
    .map(
      (step, index) => `
      <tr>
        <td style="padding:0 0 14px;vertical-align:top;width:34px;">
          <div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:999px;background:${EMAIL_BRAND.blue};color:#fff;font-size:13px;font-weight:800;">
            ${index + 1}
          </div>
        </td>
        <td style="padding:0 0 14px 10px;vertical-align:top;">
          <div style="font-size:14px;font-weight:700;color:${EMAIL_BRAND.text};margin-bottom:2px;">${step.title}</div>
          <div style="font-size:13px;line-height:1.6;color:${EMAIL_BRAND.textMuted};">${step.description}</div>
        </td>
      </tr>`
    )
    .join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      ${rows}
    </table>`
}

export function quoteBlock(text: string, author?: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td style="padding:18px 20px;background:linear-gradient(135deg, ${EMAIL_BRAND.blueDark} 0%, ${EMAIL_BRAND.blue} 100%);border-radius:14px;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#ffffff;font-style:italic;">
            « ${text} »
          </p>
          ${
            author
              ? `<p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">— ${author}</p>`
              : ''
          }
        </td>
      </tr>
    </table>`
}

export function divider() {
  return `<hr style="margin:24px 0;border:none;border-top:1px solid ${EMAIL_BRAND.border};" />`
}

export function otpBox(tokenVar = '{{ .Token }}') {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      <tr>
        <td align="center" style="padding:18px;background:#f9fafb;border:1px dashed ${EMAIL_BRAND.border};border-radius:12px;">
          <div style="font-size:12px;color:${EMAIL_BRAND.textMuted};margin-bottom:8px;letter-spacing:0.06em;text-transform:uppercase;">
            Code de vérification
          </div>
          <div style="font-size:32px;font-weight:800;letter-spacing:0.28em;color:${EMAIL_BRAND.blue};font-family:Consolas,Monaco,monospace;">
            ${tokenVar}
          </div>
        </td>
      </tr>
    </table>`
}

export function linkFallback(urlVar: string) {
  return `
    <p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.textMuted};word-break:break-all;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
      <a href="${urlVar}" style="color:${EMAIL_BRAND.green};">${urlVar}</a>
    </p>`
}

export function trialProgress(daysLeft: number, totalDays: number) {
  const used = Math.max(0, totalDays - daysLeft)
  const percent = Math.min(100, Math.round((used / totalDays) * 100))

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      <tr>
        <td style="padding:16px 18px;background:${EMAIL_BRAND.accentSoft};border:1px solid #d9f0c0;border-radius:12px;">
          <div style="font-size:13px;font-weight:700;color:${EMAIL_BRAND.green};margin-bottom:8px;">
            Période d'essai — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:8px;background:#dcefc8;border-radius:999px;overflow:hidden;">
                <div style="width:${percent}%;height:8px;background:linear-gradient(90deg, ${EMAIL_BRAND.accent}, ${EMAIL_BRAND.green});border-radius:999px;"></div>
              </td>
            </tr>
          </table>
          <div style="margin-top:8px;font-size:12px;color:${EMAIL_BRAND.textMuted};">
            Jour ${used + 1} sur ${totalDays} · Profitez de toutes les fonctionnalités EduNation
          </div>
        </td>
      </tr>
    </table>`
}

export function supportLine() {
  return paragraph(
    `Une question ? Notre équipe vous accompagne à <a href="mailto:${EMAIL_SUPPORT}" style="color:${EMAIL_BRAND.green};font-weight:600;">${EMAIL_SUPPORT}</a>.`
  )
}

export function signatureBlock() {
  return `
    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:${EMAIL_BRAND.textBody};">
      Avec toute notre considération,<br />
      <strong style="color:${EMAIL_BRAND.green};">L'équipe EduNation</strong><br />
      <span style="font-size:12px;color:${EMAIL_BRAND.textMuted};">Plateforme scolaire numérique · Burkina Faso</span>
    </p>`
}
