'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { endQaVerification } from '@/lib/actions/platform-qa-verification'
import { notify } from '@/lib/feedback/toast'
import { cn } from '@/lib/utils'

type QaVerificationExitButtonProps = {
  className?: string
  compact?: boolean
}

export function QaVerificationExitButton({
  className,
  compact = false,
}: QaVerificationExitButtonProps) {
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
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        'border-amber-400/80 bg-amber-50 text-amber-950 hover:bg-amber-100',
        className,
      )}
      disabled={isPending}
      onClick={handleExit}
    >
      <LogOut className={cn('h-3.5 w-3.5', !compact && 'mr-1.5')} />
      {!compact && (isPending ? 'Sortie…' : 'Admin plateforme')}
      {compact && <span className="sr-only">{isPending ? 'Sortie…' : 'Retour admin plateforme'}</span>}
    </Button>
  )
}
