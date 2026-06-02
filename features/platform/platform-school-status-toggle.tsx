'use client'

import { useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { setPlatformSchoolStatus } from '@/lib/actions/platform'
import { notify } from '@/lib/feedback/toast'

export function PlatformSchoolStatusToggle({
  schoolId,
  isActive,
}: {
  schoolId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
      <span className="text-sm font-medium text-slate-700">
        {isActive ? 'Actif' : 'Suspendu'}
      </span>
      <Switch
        checked={isActive}
        disabled={isPending}
        onCheckedChange={next => {
          startTransition(async () => {
            const result = await setPlatformSchoolStatus(
              schoolId,
              next ? 'ACTIVE' : 'SUSPENDED',
              next ? 'Réactivation depuis fiche établissement' : 'Suspension depuis fiche établissement'
            )
            if ('error' in result && result.error) notify.error(result.error)
            else notify.success(next ? 'Établissement activé' : 'Établissement suspendu')
          })
        }}
      />
    </div>
  )
}
