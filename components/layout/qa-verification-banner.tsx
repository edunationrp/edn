'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, LogOut, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { endQaVerification } from '@/lib/actions/platform-qa-verification'
import { getQaRoleLabel } from '@/lib/platform/qa-verification'
import type { UserRole } from '@/types/roles'
import { notify } from '@/lib/feedback/toast'

type QaVerificationBannerProps = {
  schoolName: string
  roleCode: UserRole
}

export function QaVerificationBanner({ schoolName, roleCode }: QaVerificationBannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleExit() {
    startTransition(async () => {
      const result = await endQaVerification()
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      router.push(result.redirectTo)
      router.refresh()
    })
  }

  return (
    <div className="no-print border-b border-amber-300/80 bg-gradient-to-r from-amber-50 via-amber-50/95 to-orange-50 px-4 py-2.5 sm:px-5">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 sm:mt-0">
            <Eye className="h-4 w-4 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-amber-950">
              <span>Mode vérification</span>
              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {getQaRoleLabel(roleCode)}
              </span>
            </p>
            <p className="text-xs text-amber-900/80">
              Vous naviguez comme le personnel de{' '}
              <span className="font-medium">{schoolName}</span>. Les droits affichés correspondent à
              ce rôle simulé.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 text-xs text-amber-800/90 sm:flex">
            <ShieldAlert className="h-3.5 w-3.5" />
            Super admin
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-400/80 bg-white/80 text-amber-950 hover:bg-white"
            disabled={isPending}
            onClick={handleExit}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Sortie…' : 'Quitter la vérification'}
          </Button>
        </div>
      </div>
    </div>
  )
}
