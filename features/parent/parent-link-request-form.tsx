'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestParentStudentLink } from '@/lib/actions/parent-link'
import { useRouter } from 'next/navigation'

const schema = z.object({
  studentIun: z.string().regex(/^BF-\d{4}-\d{6}-\d$/, 'Format : BF-XXXX-XXXXXX-C'),
  relationship: z.enum(['parent', 'tuteur', 'autre']),
  message: z.string().max(500).optional(),
})
type FormData = z.infer<typeof schema>

export function ParentLinkRequestForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { relationship: 'parent' },
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = await requestParentStudentLink({
      studentIun: data.studentIun.trim().toUpperCase(),
      relationship: data.relationship,
      message: data.message,
    })
    if (result.error) { setServerError(result.error); return }
    setSuccess(true)
    reset()
    router.refresh()
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
        Demande envoyée. La secrétaire de l'établissement va valider votre demande.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label>IUN de l'élève</Label>
        <div className="relative">
          <GraduationCap className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register('studentIun')}
            placeholder="BF-2013-001234-5"
            className="pl-8 uppercase"
            onChange={e => { e.target.value = e.target.value.toUpperCase() }}
          />
        </div>
        {errors.studentIun && <p className="text-xs text-destructive">{errors.studentIun.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Lien de parenté</Label>
        <select {...register('relationship')} className="h-9 w-full rounded-md border px-3 text-sm">
          <option value="parent">Parent</option>
          <option value="tuteur">Tuteur légal</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label>Message (optionnel)</Label>
        <Input {...register('message')} placeholder="Informations complémentaires pour la secrétaire" />
      </div>

      {serverError && <p className="text-xs text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi…' : 'Envoyer la demande'}
      </Button>
    </form>
  )
}
