import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

type DashboardPageProps = {
  children: ReactNode
  className?: string
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return <div className={cn(dashboard.page, className)}>{children}</div>
}
