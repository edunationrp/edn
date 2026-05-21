'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { insertRecord } from '@/lib/supabase/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Phone, MapPin, GraduationCap, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

const enrollmentSchema = z.object({
  first_name: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  last_name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  birth_date: z.string().min(1, 'Date de naissance requise'),
  birth_place: z.string().min(2, 'Lieu de naissance requis'),
  gender: z.enum(['M', 'F']).refine(v => ['M', 'F'].includes(v), { message: 'Genre requis' }),
  nationality: z.string().optional(),
  address: z.string().optional(),
  class_id: z.string().min(1, 'Classe requise'),
  parent_first_name: z.string().optional(),
  parent_last_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_has_phone: z.boolean().optional(),
})

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>

interface StudentEnrollmentFormProps {
  schoolId: string
  currentYear: { id: string; name: string } | null
  classes: Array<{ id: string; name: string }>
  levels: Array<{ id: string; name: string; order_num: number | null }>
}

export function StudentEnrollmentForm({
  schoolId,
  currentYear,
  classes,
  levels,
}: StudentEnrollmentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{ iun: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parentHasPhone, setParentHasPhone] = useState(true)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      nationality: 'Burkinabè',
      parent_has_phone: true,
    },
  })

  async function onSubmit(values: EnrollmentFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Insérer l'élève
      const { data: students, error: studentError } = await insertRecord<{
        id: string; iun: string | null; first_name: string; last_name: string
      }>(
        'students',
        {
          school_id: schoolId,
          first_name: values.first_name,
          last_name: values.last_name,
          birth_date: values.birth_date,
          birth_place: values.birth_place,
          gender: values.gender,
          nationality: values.nationality ?? 'Burkinabè',
          address: values.address ?? null,
          status: 'pending',
        },
        'id, iun, first_name, last_name'
      )

      if (studentError) throw new Error(studentError.message)

      const student = students?.[0]
      if (!student) throw new Error("Erreur lors de la création de l'élève")

      // Créer l'inscription à la classe si classe + année scolaire disponibles
      if (currentYear && values.class_id) {
        await insertRecord('student_enrollments', {
          student_id: student.id,
          school_id: schoolId,
          class_id: values.class_id,
          school_year_id: currentYear.id,
          status: 'active',
        })
      }

      // Créer le parent si infos fournies
      if (values.parent_first_name && values.parent_last_name) {
        await insertRecord('parent_pre_registrations', {
          school_id: schoolId,
          first_name: values.parent_first_name,
          last_name: values.parent_last_name,
          phone: values.parent_phone ?? null,
          has_phone: parentHasPhone,
          linked_student_id: student.id,
        })
      }

      setSuccessData({
        iun: student.iun ?? 'En cours de génération',
        name: `${student.first_name} ${student.last_name}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successData) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-800">Inscription enregistrée !</h2>
            <p className="text-green-700 mt-1">{successData.name}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-green-200 inline-block">
            <p className="text-sm text-muted-foreground">Identifiant Unique National (IUN)</p>
            <p className="text-2xl font-mono font-bold text-primary tracking-widest mt-1">
              {successData.iun}
            </p>
          </div>
          <p className="text-sm text-green-700">
            L&apos;inscription est en attente de validation par le secrétariat.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setSuccessData(null)}>
              Inscrire un autre élève
            </Button>
            <Button onClick={() => router.push('/dashboard/students')}>
              Voir la liste des élèves
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations de l'élève */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom <span className="text-red-500">*</span></Label>
            <Input id="last_name" placeholder="OUEDRAOGO" {...register('last_name')} className="uppercase" />
            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
            <Input id="first_name" placeholder="Kader" {...register('first_name')} />
            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Date de naissance <span className="text-red-500">*</span></Label>
            <Input id="birth_date" type="date" {...register('birth_date')} />
            {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_place">Lieu de naissance <span className="text-red-500">*</span></Label>
            <Input id="birth_place" placeholder="Ouagadougou" {...register('birth_place')} />
            {errors.birth_place && <p className="text-xs text-red-500">{errors.birth_place.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Genre <span className="text-red-500">*</span></Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="M" {...register('gender')} className="accent-primary" />
                <span className="text-sm">Masculin</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="F" {...register('gender')} className="accent-primary" />
                <span className="text-sm">Féminin</span>
              </label>
            </div>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationalité</Label>
            <Input id="nationality" placeholder="Burkinabè" {...register('nationality')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse / Quartier</Label>
            <Input id="address" placeholder="Secteur 15, Ouagadougou" {...register('address')} />
          </div>
        </CardContent>
      </Card>

      {/* Scolarité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            Inscription scolaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentYear ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Année scolaire active : {currentYear.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">Aucune année scolaire active. L&apos;élève sera inscrit sans affectation de classe.</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="class_id">Classe <span className="text-red-500">*</span></Label>
            <select
              id="class_id"
              {...register('class_id')}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            {errors.class_id && <p className="text-xs text-red-500">{errors.class_id.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Parent / Tuteur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-600" />
            Parent / Tuteur légal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parentHasPhone}
                onChange={e => setParentHasPhone(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm font-medium">Le parent possède un téléphone</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_last_name">Nom du parent</Label>
              <Input id="parent_last_name" placeholder="OUEDRAOGO" {...register('parent_last_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_first_name">Prénom du parent</Label>
              <Input id="parent_first_name" placeholder="Sali" {...register('parent_first_name')} />
            </div>
            {parentHasPhone && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="parent_phone">Numéro de téléphone</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">+226</span>
                  <Input
                    id="parent_phone"
                    placeholder="70 00 00 00"
                    {...register('parent_phone')}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            )}
            {!parentHasPhone && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Le parent sera invité à utiliser l&apos;interface simplifiée avec code QR à l&apos;établissement.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Inscription en cours…
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Inscrire l&apos;élève
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
