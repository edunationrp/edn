import { createClient } from '@/lib/supabase/server'
import { getInvitationPreview } from '@/lib/actions/staff'
import { JoinStaffClient } from '@/features/staff/join-staff-client'
import { BrandLockupDark } from '@/components/brand/logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invitation personnel — EduNation',
}

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function JoinStaffPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await getInvitationPreview(token)

  const preview = 'preview' in result && result.preview
    ? {
        ...result.preview,
        isValid: result.preview.status === 'pending' && !result.preview.isExpired,
      }
    : null

  let loggedInContactEmail: string | null = null
  let isMemberOfInvitationSchool = false

  if (user) {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .limit(1)

    loggedInContactEmail =
      (profileRaw as Array<{ email: string | null }> | null)?.[0]?.email?.trim() ||
      user.email ||
      null

    if (preview?.schoolId) {
      const { data: roleRaw } = await supabase
        .from('user_school_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('school_id', preview.schoolId)
        .limit(1)

      isMemberOfInvitationSchool = ((roleRaw ?? []) as unknown[]).length > 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
        <div className="mb-8 flex justify-center">
          <BrandLockupDark className="h-8" />
        </div>
        <JoinStaffClient
          token={token}
          isLoggedIn={!!user}
          loggedInContactEmail={loggedInContactEmail}
          isMemberOfInvitationSchool={isMemberOfInvitationSchool}
          preview={preview}
          error={'error' in result ? result.error : undefined}
        />
      </div>
    </div>
  )
}
