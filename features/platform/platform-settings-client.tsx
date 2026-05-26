'use client'

import { Shield, Mail, Globe, Server } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPublicAppUrl } from '@/lib/env/public'

type PlatformSettingsClientProps = {
  emailConfigured: boolean
  serviceRoleConfigured: boolean
}

export function PlatformSettingsClient({
  emailConfigured,
  serviceRoleConfigured,
}: PlatformSettingsClientProps) {
  const appUrl = getPublicAppUrl()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-violet-600" />
            Identité plateforme
          </CardTitle>
          <CardDescription>EduNation — Super administration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b pb-3">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-semibold">EduNation</span>
          </div>
          <div className="flex justify-between gap-4 border-b pb-3">
            <span className="text-muted-foreground">URL publique</span>
            <span className="font-mono text-xs break-all text-right">{appUrl}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Région par défaut</span>
            <span className="font-medium">Burkina Faso (BF)</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-[#1B3A6B]" />
            Services techniques
          </CardTitle>
          <CardDescription>État des intégrations critiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Emails (Resend)</p>
                <p className="text-xs text-muted-foreground">Invitations, notifications</p>
              </div>
            </div>
            <Badge variant={emailConfigured ? 'success' : 'warning'}>
              {emailConfigured ? 'Configuré' : 'Non configuré'}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Supabase Service Role</p>
                <p className="text-xs text-muted-foreground">Actions admin cross-tenant</p>
              </div>
            </div>
            <Badge variant={serviceRoleConfigured ? 'success' : 'destructive'}>
              {serviceRoleConfigured ? 'Configuré' : 'Manquant'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Plans disponibles
          </CardTitle>
          <CardDescription>Formules d&apos;abonnement actuellement supportées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-violet-900">Starter</p>
                <p className="text-sm text-violet-700/80">
                  Jusqu&apos;à 3 établissements par organisation
                </p>
              </div>
              <Badge className="bg-violet-200 text-violet-900">Plan par défaut</Badge>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Les plans Enterprise et Pro pourront être ajoutés via migration base de données et
            configuration ici.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
