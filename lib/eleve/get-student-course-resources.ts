import { createClient } from '@/lib/supabase/server'
import { extractCourseResourceStoragePath } from '@/lib/eleve/course-resources'

export type StudentCourseResource = {
  id: string
  title: string
  description: string | null
  fileName: string
  fileSizeBytes: number | null
  type: string
  subjectId: string | null
  subjectName: string
  teacherId: string
  teacherName: string
  downloadUrl: string
  publishedAt: string | null
}

export async function getStudentCourseResources(
  classId: string,
  schoolYearId: string,
): Promise<StudentCourseResource[]> {
  const supabase = await createClient()

  const { data: resourcesRaw } = await supabase
    .from('course_resources')
    .select(`
      id, title, description, file_url, file_name, file_size_bytes, type, published_at,
      uploaded_by, subject_id,
      subjects(name),
      profiles:uploaded_by(full_name)
    `)
    .eq('class_id', classId)
    .eq('school_year_id', schoolYearId)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  type Row = {
    id: string
    title: string
    description: string | null
    file_url: string
    file_name: string
    file_size_bytes: number | null
    type: string
    published_at: string | null
    uploaded_by: string
    subject_id: string | null
    subjects: { name: string } | null
    profiles: { full_name: string | null } | null
  }

  const rows = (resourcesRaw ?? []) as Row[]

  return Promise.all(
    rows.map(async row => {
      const storagePath = extractCourseResourceStoragePath(row.file_url)
      let downloadUrl = row.file_url

      if (storagePath) {
        const { data: signed } = await supabase.storage
          .from('course-resources')
          .createSignedUrl(storagePath, 3600)
        if (signed?.signedUrl) downloadUrl = signed.signedUrl
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        fileName: row.file_name,
        fileSizeBytes: row.file_size_bytes,
        type: row.type,
        subjectId: row.subject_id,
        subjectName: row.subjects?.name ?? 'Général',
        teacherId: row.uploaded_by,
        teacherName: row.profiles?.full_name ?? 'Professeur',
        downloadUrl,
        publishedAt: row.published_at,
      }
    }),
  )
}
