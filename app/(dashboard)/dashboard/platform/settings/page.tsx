import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformSettingsClient } from '@/features/platform/platform-settings-client'
import { SuperAdminCapabilities } from '@/features/platform/super-admin-capabilities'
import { isEmailConfigured } from '@/lib/email/client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paramètres plateforme — Super Admin',
}

export default function PlatformSettingsPage() {
  const emailConfigured = isEmailConfigured()
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Paramètres plateforme"
        description="Configuration globale EduNation et état des services"
        badge="Plateforme"
      />
      <PlatformSettingsClient
        emailConfigured={emailConfigured}
        serviceRoleConfigured={serviceRoleConfigured}
      />
      <SuperAdminCapabilities />
    </div>
  )
}
