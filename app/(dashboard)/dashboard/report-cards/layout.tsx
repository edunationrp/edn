import { assertProviseurNotInPedagogy } from '@/lib/dashboard/proviseur-pedagogy-guard'

export default async function ReportCardsLayout({ children }: { children: React.ReactNode }) {
  await assertProviseurNotInPedagogy()
  return children
}
