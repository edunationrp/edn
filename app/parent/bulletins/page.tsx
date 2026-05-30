import { createClient } from '@/lib/supabase/server'

import { redirect } from 'next/navigation'

import { requireParentPortalAccess } from '@/lib/parent/parent-context'

import { ParentNoChildState } from '@/features/parent/parent-no-child-state'

import { fetchPublishedFamilyBulletins } from '@/lib/report-cards/family-bulletins'

import { FamilyBulletinsList } from '@/features/report-cards/family-bulletins-list'

import type { Metadata } from 'next'



export const metadata: Metadata = { title: 'Bulletins — Espace parent' }



export default async function ParentBulletinsPage() {

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login/parent')



  const { activeChild } = await requireParentPortalAccess(user.id)

  if (!activeChild) {

    return <ParentNoChildState title="Bulletins" />

  }



  const bulletinsRaw = await fetchPublishedFamilyBulletins(supabase, activeChild.studentId)



  const bulletins = bulletinsRaw.map(bulletin => ({

    id: bulletin.id,

    period: bulletin.period,

    term: bulletin.term,

    average: bulletin.average,

    rank: bulletin.rank,

    class_size: bulletin.class_size,

    schoolYearName: bulletin.school_years?.name ?? null,

    snapshot: bulletin.snapshot_json!,

  }))



  return (

    <div className="w-full min-w-0 space-y-4 sm:space-y-5">

      <div>

        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Bulletins</h1>

        <p className="text-sm text-muted-foreground">

          {activeChild.fullName} · {activeChild.schoolName}

        </p>

        <p className="mt-1 text-xs text-muted-foreground">

          Aperçu complet de chaque bulletin publié — imprimez ou téléchargez directement ci-dessous.

        </p>

      </div>



      <FamilyBulletinsList bulletins={bulletins} />

    </div>

  )

}

