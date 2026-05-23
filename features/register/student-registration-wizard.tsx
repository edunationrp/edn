'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, ArrowRight, CheckCircle, GraduationCap, Loader2,
  MapPin, Phone, School, Search, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  enrollStudentPublic,
  listPublicSchools,
  listSchoolClassesForRegistration,
} from '@/lib/actions/enrollment'
import { notify } from '@/lib/feedback/toast'

const TOTAL_STEPS = 4

const studentSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  birthDate: z.string().min(1, 'Date requise'),
  birthPlace: z.string().min(2, 'Lieu requis'),
  gender: z.enum(['M', 'F']),
  nationality: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().optional(),
  studentPhone: z.string().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentPhone: z.string().optional(),
})

type StudentFormValues = z.infer<typeof studentSchema>

type SchoolOption = { id: string; name: string; city: string | null; type: string }
type ClassOption = { id: string; name: string }

type StudentRegistrationWizardProps = {
  mode: 'with-phone' | 'without-phone'
}

export function StudentRegistrationWizard({ mode }: StudentRegistrationWizardProps) {
  const hasStudentPhone = mode === 'with-phone'
  const [step, setStep] = useState(1)
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [parentHasPhone, setParentHasPhone] = useState(true)
  const [success, setSuccess] = useState<{ iun: string; fullName: string; schoolName: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { nationality: 'Burkinabè', gender: 'M' },
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingSchools(true)
      const result = await listPublicSchools(schoolQuery || undefined)
      if (!cancelled && 'schools' in result) {
        setSchools(result.schools ?? [])
      }
      setLoadingSchools(false)
    }
    const timer = setTimeout(load, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [schoolQuery])

  async function selectSchool(school: SchoolOption) {
    setSelectedSchool(school)
    setLoadingClasses(true)
    const result = await listSchoolClassesForRegistration(school.id)
    setClasses(result.classes ?? [])
    setLoadingClasses(false)
    setStep(2)
  }

  function onSubmit(values: StudentFormValues) {
    if (!selectedSchool) return

    startTransition(async () => {
      const result = await enrollStudentPublic({
        schoolId: selectedSchool.id,
        firstName: values.firstName,
        lastName: values.lastName,
        birthDate: values.birthDate,
        birthPlace: values.birthPlace,
        gender: values.gender,
        nationality: values.nationality,
        address: values.address,
        classId: values.classId,
        studentPhone: hasStudentPhone ? values.studentPhone : undefined,
        parentFirstName: values.parentFirstName,
        parentLastName: values.parentLastName,
        parentPhone: parentHasPhone ? values.parentPhone : undefined,
        hasStudentPhone,
      })

      if ('error' in result && result.error) {
        notify.error(result.error, 'student_register')
        return
      }

      if ('success' in result && result.success) {
        setSuccess({
          iun: result.iun,
          fullName: result.fullName,
          schoolName: result.schoolName,
        })
        setStep(TOTAL_STEPS + 1)
      }
    })
  }

  const progress = Math.min(100, Math.round((step / TOTAL_STEPS) * 100))

  if (success) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
        <h2 className="text-base font-bold text-gray-900">Inscription enregistrée</h2>
        <p className="text-xs text-muted-foreground">
          {success.fullName} — {success.schoolName}
        </p>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Identifiant Unique National (IUN)</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-[#1a4d2e]">{success.iun}</p>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Présentez-vous au secrétariat avec ce code pour finaliser l&apos;inscription.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <Link
          href="/register/student"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Changer de parcours
        </Link>
        <h1 className="mt-1.5 text-base font-bold text-gray-900">Inscription élève</h1>
        <p className="text-[11px] text-muted-foreground">
          {hasStudentPhone
            ? 'Parcours avec téléphone personnel'
            : 'Parcours sans téléphone — notifications via le parent'}
        </p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Étape {Math.min(step, TOTAL_STEPS)} / {TOTAL_STEPS}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#1a4d2e] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <School className="h-4 w-4 text-[#1a4d2e]" />
              Choisir l&apos;établissement
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou ville…"
                className="pl-9"
                value={schoolQuery}
                onChange={e => setSchoolQuery(e.target.value)}
              />
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {loadingSchools ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : schools.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Aucun établissement trouvé</p>
              ) : (
                schools.map(school => (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => selectSchool(school)}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:border-[#1a4d2e]/40 hover:bg-[#1a4d2e]/5"
                  >
                    <div>
                      <p className="text-sm font-medium">{school.name}</p>
                      <p className="text-xs text-muted-foreground">{school.city ?? 'Burkina Faso'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{school.type}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedSchool && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Établissement : </span>
              <strong>{selectedSchool.name}</strong>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-[#1a4d2e]" />
              Informations de l&apos;élève
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lastName">Nom *</Label>
                <Input id="lastName" className="uppercase" {...register('lastName')} />
                {errors.lastName && <p className="text-[10px] text-destructive">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-[10px] text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthDate">Date de naissance *</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthPlace">Lieu de naissance *</Label>
                <Input id="birthPlace" {...register('birthPlace')} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Genre *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="M" {...register('gender')} /> Masculin
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="F" {...register('gender')} /> Féminin
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input id="nationality" {...register('nationality')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" {...register('address')} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)}>Retour</Button>
              <Button type="button" size="sm" className="bg-[#1a4d2e] hover:bg-[#2d6a4f]" onClick={() => setStep(3)}>
                Continuer <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              Scolarité &amp; contacts
            </div>
            <div className="space-y-1">
              <Label htmlFor="classId">Classe souhaitée</Label>
              {loadingClasses ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <select
                  id="classId"
                  {...register('classId')}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">— Optionnel —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {hasStudentPhone && (
              <div className="space-y-1">
                <Label htmlFor="studentPhone">Téléphone de l&apos;élève</Label>
                <div className="flex">
                  <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-2 text-xs">+226</span>
                  <Input id="studentPhone" placeholder="70 00 00 00" className="rounded-l-none" {...register('studentPhone')} />
                </div>
              </div>
            )}

            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" /> Parent / tuteur
              </p>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={parentHasPhone}
                  onChange={e => setParentHasPhone(e.target.checked)}
                  className="accent-[#1a4d2e]"
                />
                Le parent possède un téléphone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nom parent" {...register('parentLastName')} />
                <Input placeholder="Prénom parent" {...register('parentFirstName')} />
              </div>
              {parentHasPhone ? (
                <Input placeholder="Téléphone parent (+226…)" {...register('parentPhone')} />
              ) : (
                <p className="flex items-start gap-2 text-xs text-blue-700">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Le parent pourra utiliser l&apos;interface simplifiée avec un code QR à l&apos;établissement.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(2)}>Retour</Button>
              <Button type="button" size="sm" className="bg-[#1a4d2e] hover:bg-[#2d6a4f]" onClick={() => setStep(4)}>
                Vérifier <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Récapitulatif</p>
            <Card>
              <CardContent className="space-y-1 py-3 text-sm">
                <p><span className="text-muted-foreground">Élève :</span> {watch('firstName')} {watch('lastName')}</p>
                <p><span className="text-muted-foreground">Naissance :</span> {watch('birthDate')} — {watch('birthPlace')}</p>
                <p><span className="text-muted-foreground">Établissement :</span> {selectedSchool?.name}</p>
                {watch('classId') && (
                  <p><span className="text-muted-foreground">Classe :</span> {classes.find(c => c.id === watch('classId'))?.name}</p>
                )}
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              En validant, un IUN sera généré automatiquement. L&apos;inscription reste en attente de validation au secrétariat.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(3)}>Retour</Button>
              <Button type="submit" size="sm" className="flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer l\'inscription'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
