'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { completeAdmissionDossier } from '@/lib/actions/admissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import {
  DOCUMENT_LABELS,
  REQUIRED_DOCUMENTS,
  getDefaultDocuments,
  type DocumentKey,
  type DocumentStatus,
} from '@/lib/admissions/dossier-metadata'
import type { AdmissionDossierMetadata } from '@/lib/admissions/dossier-metadata'
import { notify } from '@/lib/feedback/toast'

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  birth_date: z.string().min(1),
  birth_place: z.string().min(2),
  gender: z.enum(['M', 'F']),
  nationality: z.string().optional(),
  address: z.string().optional(),
  class_id: z.string().min(1),
  parent_first_name: z.string().optional(),
  parent_last_name: z.string().optional(),
  parent_phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  requestId: string
  initial: AdmissionDossierMetadata
  classes: Array<{ id: string; name: string }>
  readOnly?: boolean
}

export function AdmissionDossierForm({ requestId, initial, classes, readOnly }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documents, setDocuments] = useState<Record<DocumentKey, DocumentStatus>>({
    ...getDefaultDocuments(),
    ...initial.documents,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: initial.first_name ?? '',
      last_name: initial.last_name ?? '',
      birth_date: initial.birth_date ?? '',
      birth_place: initial.birth_place ?? '',
      gender: initial.gender ?? 'M',
      nationality: initial.nationality ?? 'Burkinabè',
      address: initial.address ?? '',
      class_id: initial.class_id ?? '',
      parent_first_name: initial.parent_first_name ?? '',
      parent_last_name: initial.parent_last_name ?? '',
      parent_phone: initial.parent_phone ?? '',
    },
  })

  function cycleDocument(key: DocumentKey) {
    if (readOnly) return
    setDocuments(prev => {
      const order: DocumentStatus[] = ['missing', 'deposed', 'validated']
      const next = order[(order.indexOf(prev[key]) + 1) % order.length]
      return { ...prev, [key]: next }
    })
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const result = await completeAdmissionDossier(requestId, {
        firstName: values.first_name,
        lastName: values.last_name,
        birthDate: values.birth_date,
        birthPlace: values.birth_place,
        gender: values.gender,
        nationality: values.nationality,
        address: values.address,
        classId: values.class_id,
        parentFirstName: values.parent_first_name,
        parentLastName: values.parent_last_name,
        parentPhone: values.parent_phone,
        documents,
      })
      if ('error' in result && result.error) throw new Error(result.error)
      notify.success('Dossier enregistré')
      router.refresh()
    } catch (err) {
      notify.error(err, 'dossier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identité de l&apos;élève</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" error={errors.first_name?.message}>
            <Input {...register('first_name')} disabled={readOnly} />
          </Field>
          <Field label="Nom" error={errors.last_name?.message}>
            <Input {...register('last_name')} disabled={readOnly} />
          </Field>
          <Field label="Date de naissance" error={errors.birth_date?.message}>
            <Input type="date" {...register('birth_date')} disabled={readOnly} />
          </Field>
          <Field label="Lieu de naissance" error={errors.birth_place?.message}>
            <Input {...register('birth_place')} disabled={readOnly} />
          </Field>
          <Field label="Genre" error={errors.gender?.message}>
            <select {...register('gender')} disabled={readOnly} className="flex h-10 w-full rounded-md border px-3 text-sm">
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </Field>
          <Field label="Nationalité">
            <Input {...register('nationality')} disabled={readOnly} />
          </Field>
          <Field label="Adresse" className="sm:col-span-2">
            <Input {...register('address')} disabled={readOnly} />
          </Field>
          <Field label="Classe" error={errors.class_id?.message}>
            <select {...register('class_id')} disabled={readOnly} className="flex h-10 w-full rounded-md border px-3 text-sm">
              <option value="">— Sélectionner —</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parent / tuteur</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom parent">
            <Input {...register('parent_first_name')} disabled={readOnly} />
          </Field>
          <Field label="Nom parent">
            <Input {...register('parent_last_name')} disabled={readOnly} />
          </Field>
          <Field label="Téléphone" className="sm:col-span-2">
            <Input {...register('parent_phone')} disabled={readOnly} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pièces obligatoires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {REQUIRED_DOCUMENTS.map(key => (
            <button
              key={key}
              type="button"
              disabled={readOnly}
              onClick={() => cycleDocument(key)}
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm disabled:opacity-70"
            >
              <span>{DOCUMENT_LABELS[key]}</span>
              <span className={
                documents[key] === 'validated'
                  ? 'text-green-600 font-semibold'
                  : documents[key] === 'deposed'
                    ? 'text-amber-600'
                    : 'text-slate-500'
              }>
                {documents[key] === 'validated' ? 'Validé' : documents[key] === 'deposed' ? 'Déposé' : 'Manquant'}
              </span>
            </button>
          ))}
          {!readOnly && (
            <p className="text-xs text-muted-foreground">
              Cliquez sur chaque pièce pour changer le statut : Manquant → Déposé → Validé.
            </p>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer le dossier
        </Button>
      )}
    </form>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
