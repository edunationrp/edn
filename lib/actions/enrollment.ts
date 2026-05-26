'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type PublicStudentEnrollmentInput = {
  schoolId: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  gender: 'M' | 'F'
  nationality?: string
  address?: string
  classId?: string
  studentPhone?: string
  parentFirstName?: string
  parentLastName?: string
  parentPhone?: string
  hasStudentPhone: boolean
}

function getAdminOrClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

async function generateIun(birthDate: string) {
  const birthYear = new Date(birthDate).getFullYear()
  const admin = getAdminOrClient()
  const supabase = admin ?? await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('generate_iun', {
    p_birth_year: birthYear,
  })

  if (error || !data) {
    return { error: error?.message ?? 'Impossible de générer l\'IUN.' }
  }

  return { iun: data as string }
}

export async function enrollStudentPublic(
  input: PublicStudentEnrollmentInput,
  options?: { mode?: 'public' | 'staff' }
) {
  const mode = options?.mode ?? 'public'
  const studentStatus = mode === 'staff' ? 'active' : 'pending'
  const enrollmentStatus = mode === 'staff' ? 'active' : 'pending'
  if (!input.schoolId?.trim()) return { error: 'Établissement requis.' }
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { error: 'Nom et prénom requis.' }
  }

  const admin = getAdminOrClient()
  const db = admin ?? await createClient()

  const { data: schoolRaw } = await db
    .from('schools')
    .select('id, name, is_active')
    .eq('id', input.schoolId)
    .limit(1)

  const school = (schoolRaw as Array<{ id: string; name: string; is_active: boolean }> | null)?.[0]
  if (!school?.is_active) return { error: 'Établissement introuvable ou inactif.' }

  const iunResult = await generateIun(input.birthDate)
  if ('error' in iunResult) return iunResult

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: studentRaw, error: studentError } = await (db as any)
    .from('students')
    .insert({
      school_id: input.schoolId,
      iun: iunResult.iun,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim().toUpperCase(),
      birth_date: input.birthDate,
      birth_place: input.birthPlace.trim(),
      gender: input.gender,
      nationality: input.nationality?.trim() || 'Burkinabè',
      address: input.address?.trim() || null,
      phone: input.hasStudentPhone ? input.studentPhone?.trim() || null : null,
      has_personal_phone: input.hasStudentPhone,
      status: studentStatus,
    })
    .select('id, iun, first_name, last_name')
    .single()

  if (studentError || !studentRaw) {
    return { error: studentError?.message ?? 'Erreur lors de l\'inscription.' }
  }

  if (input.classId) {
    const { data: classRaw, error: classError } = await db
      .from('classes')
      .select('id, school_year_id')
      .eq('id', input.classId)
      .eq('school_id', input.schoolId)
      .limit(1)

    const cls = (classRaw as Array<{ id: string; school_year_id: string }> | null)?.[0]
    if (classError || !cls) {
      return { error: classError?.message ?? 'Classe introuvable pour cet établissement.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollmentError } = await (db as any).from('student_enrollments').insert({
      school_id: input.schoolId,
      student_id: studentRaw.id,
      class_id: input.classId,
      school_year_id: cls.school_year_id,
      status: enrollmentStatus,
    })

    if (enrollmentError) {
      return { error: enrollmentError.message }
    }
  } else if (mode === 'staff') {
    return { error: 'Classe requise pour inscrire un élève.' }
  }

  if (input.parentFirstName?.trim() && input.parentLastName?.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from('parent_pre_registrations').insert({
      school_id: input.schoolId,
      first_name: input.parentFirstName.trim(),
      last_name: input.parentLastName.trim(),
      phone: input.parentPhone?.trim() || null,
      has_phone: !!input.parentPhone?.trim(),
      linked_student_id: studentRaw.id,
      status: 'pending',
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).from('student_registration_requests').insert({
    school_id: input.schoolId,
    student_id: studentRaw.id,
    channel: 'web',
    has_student_phone: input.hasStudentPhone,
    parent_phone: input.parentPhone?.trim() || null,
    status: 'pending',
    metadata: {
      class_id: input.classId ?? null,
    },
  })

  revalidatePath('/dashboard/students/pending')
  revalidatePath('/dashboard/students')
  if (input.classId) {
    revalidatePath(`/dashboard/classes/${input.classId}`)
    revalidatePath('/dashboard/classes')
  }

  return {
    success: true as const,
    studentId: studentRaw.id as string,
    iun: studentRaw.iun as string,
    fullName: `${studentRaw.first_name} ${studentRaw.last_name}`,
    schoolName: school.name,
  }
}

export async function enrollStudentStaff(
  input: Omit<PublicStudentEnrollmentInput, 'hasStudentPhone'> & { hasStudentPhone?: boolean }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  return enrollStudentPublic(
    {
      ...input,
      hasStudentPhone: input.hasStudentPhone ?? !!input.studentPhone,
    },
    { mode: 'staff' }
  )
}

export async function listPublicSchools(query?: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('schools')
    .select('id, name, city, type')
    .eq('is_active', true)
    .order('name')
    .limit(30)

  if (query?.trim()) {
    q = q.or(`name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`)
  }

  const { data, error } = await q
  if (error) return { error: error.message }

  return { schools: data as Array<{ id: string; name: string; city: string | null; type: string }> }
}

export async function listSchoolClassesForRegistration(schoolId: string) {
  const supabase = await createClient()

  const { data: yearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)

  const yearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id
  if (!yearId) return { classes: [] as Array<{ id: string; name: string }> }

  const { data } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .eq('school_year_id', yearId)
    .order('name')

  return { classes: (data as Array<{ id: string; name: string }> | null) ?? [] }
}
