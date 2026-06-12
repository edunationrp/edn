'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, FlaskConical, UserCog, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ensureQaDemoSchool,
  startQaDemoVerification,
  startQaVerification,
} from '@/lib/actions/platform-qa-verification'
import {
  QA_DEMO_DEFAULT_ROLE,
  QA_DEMO_SCHOOL_ID,
  QA_DEMO_SCHOOL_NAME,
} from '@/lib/platform/qa-demo-school'
import {
  QA_INSPECTABLE_ROLES,
  getQaRoleLabel,
  type QaInspectableSchool,
  type QaVerificationSession,
} from '@/lib/platform/qa-verification'
import { notify } from '@/lib/feedback/toast'

type QaVerificationPanelProps = {
  schools: QaInspectableSchool[]
  activeSession: QaVerificationSession | null
  demoStudentCount?: number
}

export function QaVerificationPanel({
  schools,
  activeSession,
  demoStudentCount = 0,
}: QaVerificationPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const demoSchool = schools.find(s => s.isQaDemo || s.id === QA_DEMO_SCHOOL_ID)
  const [schoolId, setSchoolId] = useState(
    activeSession?.schoolId ?? demoSchool?.id ?? '',
  )
  const [roleCode, setRoleCode] = useState<string>(
    activeSession?.roleCode ?? QA_DEMO_DEFAULT_ROLE,
  )

  function handleStart(nextSchoolId = schoolId, nextRoleCode = roleCode) {
    if (!nextSchoolId || !nextRoleCode) {
      notify.error('Sélectionnez un établissement et un rôle.')
      return
    }

    startTransition(async () => {
      const result = await startQaVerification({ schoolId: nextSchoolId, roleCode: nextRoleCode })
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Mode vérification activé.')
      router.push(result.redirectTo)
      router.refresh()
    })
  }

  function handleQuickDemoStart() {
    startTransition(async () => {
      const result = await startQaDemoVerification()
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success(`Vérification démarrée — ${QA_DEMO_SCHOOL_NAME}.`)
      router.push(result.redirectTo)
      router.refresh()
    })
  }

  function handleEnsureDemo() {
    startTransition(async () => {
      const result = await ensureQaDemoSchool()
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success(
        result.created
          ? `École démo prête (${result.studentCount} élève(s) fictif(s)).`
          : `École démo vérifiée (${result.studentCount} élève(s)).`,
      )
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Card className="border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-emerald-700" />
              Démarrage rapide — école démo
            </CardTitle>
            <CardDescription>
              Bac à sable avec élèves, classes et matières fictifs. Idéal pour tester secrétariat et
              vie scolaire sans toucher un vrai établissement.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-700">
              <span className="font-medium">{QA_DEMO_SCHOOL_NAME}</span>
              <span className="text-muted-foreground">
                {' '}
                · rôle {getQaRoleLabel(QA_DEMO_DEFAULT_ROLE)}
                {demoStudentCount > 0 ? ` · ${demoStudentCount} élève(s)` : ''}
              </span>
            </div>
            <Button type="button" disabled={isPending} onClick={handleQuickDemoStart}>
              <Zap className="mr-1.5 h-4 w-4" />
              {isPending ? 'Activation…' : 'Tester en 1 clic'}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={handleEnsureDemo}>
              Vérifier / recréer les données démo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-[#1B3A6B]" />
              Inspecter en tant que…
            </CardTitle>
            <CardDescription>
              Choisissez un établissement et un rôle personnel pour vérifier une correction sans
              compte Gmail ni invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="qa-school">Établissement</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger id="qa-school" className="w-full">
                  <SelectValue placeholder="Sélectionner un établissement…" />
                </SelectTrigger>
                <SelectContent>
                  {schools.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Aucun établissement disponible
                    </SelectItem>
                  ) : (
                    schools.map(school => (
                      <SelectItem key={school.id} value={school.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {school.name}
                          {school.isQaDemo && (
                            <Badge variant="success" className="ml-1 text-[10px]">
                              Démo
                            </Badge>
                          )}
                          {school.city ? ` — ${school.city}` : ''}
                          {!school.isActive ? ' (inactif)' : ''}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-role">Rôle personnel</Label>
              <Select value={roleCode} onValueChange={setRoleCode}>
                <SelectTrigger id="qa-role" className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle…" />
                </SelectTrigger>
                <SelectContent>
                  {QA_INSPECTABLE_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      <span className="flex items-center gap-2">
                        <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                        {getQaRoleLabel(role)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isPending || schools.length === 0}
              onClick={() => handleStart()}
            >
              {isPending ? 'Activation…' : 'Démarrer la vérification'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit border-violet-200/80 bg-violet-50/40">
        <CardHeader>
          <CardTitle className="text-base">Session active</CardTitle>
          <CardDescription>
            {activeSession
              ? 'Une vérification est en cours. Reprenez le tableau de bord ou changez de rôle.'
              : 'Aucune session en cours.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activeSession ? (
            <>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Établissement
                </p>
                <p className="font-medium text-slate-900">{activeSession.schoolName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rôle simulé
                </p>
                <p className="font-medium text-slate-900">
                  {getQaRoleLabel(activeSession.roleCode)}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isPending}
                onClick={() => handleStart()}
              >
                Relancer avec ces paramètres
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              Après activation, vous serez redirigé vers le tableau de bord avec la navigation et les
              droits du rôle choisi. Une bannière permet de quitter le mode à tout moment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
