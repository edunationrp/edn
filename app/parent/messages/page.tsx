import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/features/messages/messages-client'
import { getChatConversations } from '@/lib/actions/messages'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messagerie — Espace parent' }
export const dynamic = 'force-dynamic'

export default async function ParentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  const params = await searchParams

  if (!activeChild) {
    return <ParentNoChildState title="Messagerie" />
  }

  const conversations = await getChatConversations(activeChild.schoolId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Messagerie</h1>
        <p className="text-sm text-muted-foreground">
          Contactez le personnel de {activeChild.schoolName} concernant {activeChild.fullName}.
        </p>
      </div>

      {conversations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3A6B]" />
            <p>
              Démarrez une conversation avec la secrétaire, la vie scolaire ou un autre membre du staff
              via le bouton « Nouvelle conversation ».
            </p>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <MessagesClient
          currentUserId={user.id}
          schoolId={activeChild.schoolId}
          initialConversations={conversations}
          initialConversationId={params.c}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Besoin d&apos;envoyer un document ? Utilisez les pièces jointes dans la conversation ou{' '}
        <Link href="/parent/communications" className="font-medium text-[#1B3A6B] hover:underline">
          consultez les communications
        </Link>
        .
      </p>
    </div>
  )
}
