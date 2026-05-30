import { createClient } from '@/lib/supabase/server'

import { redirect } from 'next/navigation'

import { fetchPublishedFamilyBulletins } from '@/lib/report-cards/family-bulletins'

import { FamilyBulletinsList } from '@/features/report-cards/family-bulletins-list'

import type { Metadata } from 'next'



export const metadata: Metadata = { title: 'Mes bulletins — EduNation' }



export default async function EleveBulletinsPage() {

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login/eleve')



  const { data: studentRaw } = await supabase

    .from('students')

    .select('id')

    .eq('user_id', user.id)

    .single()



  const student = studentRaw as { id: string } | null

  if (!student) redirect('/login/eleve')



  const bulletinsRaw = await fetchPublishedFamilyBulletins(supabase, student.id)



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

        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes bulletins</h1>

        <p className="text-sm text-muted-foreground">

          Aperçu complet de vos bulletins publiés — imprimez ou téléchargez directement ci-dessous.

        </p>

      </div>



      <FamilyBulletinsList bulletins={bulletins} />

    </div>

  )

}

