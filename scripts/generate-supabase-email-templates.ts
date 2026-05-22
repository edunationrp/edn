import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  supabaseConfirmSignupTemplate,
  supabaseEmailChangeTemplate,
  supabaseInviteTemplate,
  supabaseMagicLinkTemplate,
  supabaseRecoveryTemplate,
} from '../lib/email/templates/supabase-auth'

const outDir = join(process.cwd(), 'supabase', 'email-templates')
mkdirSync(outDir, { recursive: true })

const files: Record<string, { subject: string; html: string }> = {
  'confirm-signup': supabaseConfirmSignupTemplate(),
  recovery: supabaseRecoveryTemplate(),
  'magic-link': supabaseMagicLinkTemplate(),
  invite: supabaseInviteTemplate(),
  'email-change': supabaseEmailChangeTemplate(),
}

for (const [name, template] of Object.entries(files)) {
  writeFileSync(join(outDir, `${name}.html`), template.html, 'utf8')
  writeFileSync(join(outDir, `${name}.subject.txt`), template.subject, 'utf8')
}

const readme = `EduNation — Templates email Supabase Auth
=========================================

Copiez chaque fichier .html dans Supabase Dashboard :
Authentication > Email Templates

Fichiers :
- confirm-signup  → Confirm signup
- recovery        → Reset password
- magic-link      → Magic Link
- invite          → Invite user
- email-change    → Change email address

Pour chaque template, copiez aussi le sujet depuis le fichier .subject.txt correspondant.

Variables Go utilisées : {{ .ConfirmationURL }}, {{ .SiteURL }}, {{ .Email }}, {{ .Token }}
Documentation : https://supabase.com/docs/guides/auth/auth-email-templates
`

writeFileSync(join(outDir, 'INSTRUCTIONS.txt'), readme, 'utf8')
console.log(`[EduNation] ${Object.keys(files).length} templates Supabase générés dans supabase/email-templates/`)
