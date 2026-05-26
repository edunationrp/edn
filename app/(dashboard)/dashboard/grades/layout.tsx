import { assertProviseurNotInPedagogy } from '@/lib/dashboard/proviseur-pedagogy-guard'

export default async function GradesLayout({ children }: { children: React.ReactNode }) {
  await assertProviseurNotInPedagogy()
  return children
}
