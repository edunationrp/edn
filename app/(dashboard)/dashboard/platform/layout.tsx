import { redirect } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/platform/access'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const access = await requirePlatformAdmin()
  if ('error' in access) redirect('/dashboard')

  return (
    <div className="space-y-1">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 to-white px-4 py-2.5">
        <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Super Admin
        </span>
        <p className="text-xs text-violet-800/90">
          Propriétaire SaaS EduNation — gestion globale, sans rattachement à un établissement
        </p>
      </div>
      {children}
    </div>
  )
}
