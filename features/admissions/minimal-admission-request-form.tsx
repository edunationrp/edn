'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createMinimalAdmissionRequest } from '@/lib/actions/admissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { notify } from '@/lib/feedback/toast'

const schema = z.object({
  first_name: z.string().min(2, 'Prénom requis'),
  last_name: z.string().min(2, 'Nom requis'),
  birth_date: z.string().min(1, 'Date de naissance requise'),
  class_id: z.string().optional(),
  parent_first_name: z.string().optional(),
  parent_last_name: z.string().optional(),
  parent_phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  classes: Array<{ id: string; name: string }>
}

export function MinimalAdmissionRequestForm({ classes }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const result = await createMinimalAdmissionRequest({
        firstName: values.first_name,
        lastName: values.last_name,
        birthDate: values.birth_date,
        classId: values.class_id,
        parentFirstName: values.parent_first_name,
        parentLastName: values.parent_last_name,
        parentPhone: values.parent_phone,
      })
      if ('error' in result && result.error) throw new Error(result.error)
      notify.success('Demande créée', { description: 'Le dossier a été transmis au secrétariat.' })
      router.push('/dashboard/admissions/to-process')
      router.refresh()
    } catch (err) {
      notify.error(err, 'admission_request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations minimales</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">Prénom de l&apos;enfant</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Nom de l&apos;enfant</Label>
              <Input id="last_name" {...register('last_name')} />
              {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="birth_date">Date de naissance</Label>
            <Input id="birth_date" type="date" {...register('birth_date')} />
            {errors.birth_date && <p className="mt-1 text-xs text-red-600">{errors.birth_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="class_id">Classe souhaitée</Label>
            <select id="class_id" {...register('class_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Sélectionner —</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="parent_first_name">Prénom parent</Label>
              <Input id="parent_first_name" {...register('parent_first_name')} />
            </div>
            <div>
              <Label htmlFor="parent_last_name">Nom parent</Label>
              <Input id="parent_last_name" {...register('parent_last_name')} />
            </div>
          </div>
          <div>
            <Label htmlFor="parent_phone">Téléphone parent</Label>
            <Input id="parent_phone" {...register('parent_phone')} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer la demande
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
