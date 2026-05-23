import { createClient } from '@/lib/supabase/server'
import { getInvitationPreview } from '@/lib/actions/staff'
import { JoinStaffSignupClient } from '@/features/staff/join-staff-signup-client'
import { BrandLockupDark } from '@/components/brand/logo'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Créer un compte personnel — EduNation',
}

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function JoinStaffSignupPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/join/staff/${token}`)
  }

  const result = await getInvitationPreview(token)

  const preview = 'preview' in result && result.preview
    ? {
        ...result.preview,
        isValid: result.preview.status === 'pending' && !result.preview.isExpired,
      }
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
        <div className="mb-8 flex justify-center">
          <BrandLockupDark className="h-8" />
        </div>
        <JoinStaffSignupClient
          token={token}
          preview={preview}
          error={'error' in result ? result.error : undefined}
        />
      </div>
    </div>
  )
}
