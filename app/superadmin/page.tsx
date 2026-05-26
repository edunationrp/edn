import { BrandLockupDark } from '@/components/brand/logo'
import { SuperAdminSetupForm } from '@/features/superadmin/superadmin-setup-form'
import { getSuperAdminSetupInfo } from '@/lib/actions/superadmin-setup'
import { AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setup Super Admin — EduNation',
  robots: { index: false, follow: false },
}

export default async function SuperAdminSetupPage() {
  const info = await getSuperAdminSetupInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <BrandLockupDark className="h-8" />
        </div>

        <div className="mb-6 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-950">
              <p className="font-bold">Page temporaire — à supprimer après usage</p>
              <p className="mt-1 text-amber-900/90">
                Une fois votre super admin créé, supprimez{' '}
                <code className="rounded bg-white/80 px-1 text-xs">app/superadmin/</code>{' '}
                et retirez <code className="text-xs">SUPERADMIN_SETUP_SECRET</code> du .env.
              </p>
            </div>
          </div>
        </div>

        <SuperAdminSetupForm
          superAdminCount={info.superAdminCount}
          secretConfigured={info.secretConfigured}
          serviceRoleConfigured={info.serviceRoleConfigured}
          setupError={info.error}
        />
      </div>
    </div>
  )
}
