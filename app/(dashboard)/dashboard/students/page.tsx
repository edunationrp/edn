import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { StudentsTable } from '@/features/students/students-table'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestion des élèves',
}

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const schoolRole = await getUserSchoolContext(user.id)
  const schoolId = schoolRole?.school_id

  const { data: studentsRaw, count } = await supabase
    .from('students')
    .select('id, iun, first_name, last_name, birth_date, gender, phone, status, photo_url, created_at, student_enrollments(class_id, classes(name))', { count: 'exact' })
    .eq('school_id', schoolId ?? '')
    .order('last_name', { ascending: true })
    .limit(20)

  const students = studentsRaw as Array<{
    id: string; iun: string; first_name: string; last_name: string;
    birth_date: string; gender: 'M' | 'F'; phone: string | null;
    status: string; photo_url: string | null; created_at: string;
    student_enrollments: Array<{ class_id: string; classes: { name: string } | null }>;
  }> | null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {count ?? 0} élève{(count ?? 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-[#1a4d2e] hover:bg-[#2d6a4f]">
            <Link href="/register/student">
              <UserPlus className="h-4 w-4" />
              Inscrire un élève
            </Link>
          </Button>
        </div>
      </div>

      <StudentsTable students={(students ?? []) as any} />
    </div>
  )
}
