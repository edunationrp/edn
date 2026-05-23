import { redirect } from 'next/navigation'

export default async function GradeEntryByIdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/grades/entry?evaluationId=${id}`)
}
