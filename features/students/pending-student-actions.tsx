'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserCheck } from 'lucide-react'
import { updateStudentStatus } from '@/lib/actions/students'
import { notify } from '@/lib/feedback/toast'

interface PendingStudentActionsProps {
  studentId: string
}

export function PendingStudentActions({ studentId }: PendingStudentActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAction(status: 'active' | 'rejected') {
    startTransition(async () => {
      const result = await updateStudentStatus(studentId, status)
      if (result.error) {
        notify.error(result.error, 'student_status')
        return
      }
      notify.success(
        status === 'active' ? 'Inscription validée' : 'Inscription rejetée',
        { description: 'Le dossier a été mis à jour.' }
      )
      router.refresh()
    })
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 text-red-600 border-red-300 hover:bg-red-50 sm:flex-none"
        disabled={isPending}
        onClick={() => handleAction('rejected')}
      >
        Rejeter
      </Button>
      <Button
        size="sm"
        className="flex-1 bg-green-600 hover:bg-green-700 sm:flex-none"
        disabled={isPending}
        onClick={() => handleAction('active')}
      >
        <UserCheck className="h-4 w-4" />
        Valider
      </Button>
    </div>
  )
}
