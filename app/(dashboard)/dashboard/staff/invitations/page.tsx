import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { UserPlus, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inviter du personnel' }

export default async function StaffInvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Inviter du personnel"
        description="Ajoutez des membres à votre équipe pédagogique et administrative"
      />

      <Card>
        <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:py-12">
          <UserPlus className="mb-4 h-12 w-12 text-primary/60" />
          <h2 className="text-lg font-semibold">Invitation par messagerie</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Pour inviter un collègue, contactez-le via la messagerie interne ou demandez à votre administrateur EduNation d&apos;ajouter son compte avec le rôle approprié.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/messages">
                <Mail className="h-4 w-4 mr-1" />
                Ouvrir la messagerie
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/staff">Voir l&apos;équipe</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
