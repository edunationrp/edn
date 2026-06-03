'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { LayoutGrid, List, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StaffDirectoryTable, type StaffDirectoryRow } from '@/features/staff/staff-directory-table'
import { StaffOrgChart } from '@/features/staff/staff-org-chart'
import type { SchoolOrgChartData } from '@/lib/staff/org-chart'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, STAFF_ROLES, type UserRole } from '@/types/roles'
import { dashboard } from '@/lib/dashboard/ui-classes'

type StaffPageClientProps = {
  initialView: 'liste' | 'organigramme'
  rows: StaffDirectoryRow[]
  canInvite: boolean
  canRemove: boolean
  orgChart: SchoolOrgChartData
  roleGroups: Record<string, number>
}

export function StaffPageClient({
  initialView,
  rows,
  canInvite,
  canRemove,
  orgChart,
  roleGroups,
}: StaffPageClientProps) {
  const defaultTab = initialView === 'organigramme' ? 'organigramme' : 'liste'

  const summaryRoles = useMemo(
    () => orgChart.branches.map(branch => ({
      key: branch.id,
      label: branch.label,
      count: branch.members.length,
      color: branch.color,
    })),
    [orgChart.branches],
  )

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 p-1">
        <TabsTrigger value="liste" className="gap-1.5 text-xs sm:text-sm">
          <List className="h-3.5 w-3.5" />
          Liste
        </TabsTrigger>
        <TabsTrigger value="organigramme" className="gap-1.5 text-xs sm:text-sm">
          <LayoutGrid className="h-3.5 w-3.5" />
          Organigramme
        </TabsTrigger>
      </TabsList>

      <TabsContent value="liste" className="mt-0 space-y-4">
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible lg:grid-cols-6">
          {STAFF_ROLES.map(role => (
            <div
              key={role}
              className={cn(
                dashboard.card,
                'min-w-[108px] shrink-0 snap-start p-3 text-center sm:min-w-0',
              )}
            >
              <p className="text-2xl font-bold tabular-nums text-[#1a4d2e]">{roleGroups[role]}</p>
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">
                {ROLE_LABELS[role as UserRole]}
              </p>
            </div>
          ))}
        </div>

        <StaffDirectoryTable members={rows} canRemove={canRemove} />
      </TabsContent>

      <TabsContent value="organigramme" className="mt-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          {summaryRoles.map(role => (
            <span
              key={role.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: role.color }}
              />
              {role.label}
              <strong className="tabular-nums text-slate-900">{role.count}</strong>
            </span>
          ))}
        </div>

        <StaffOrgChart data={orgChart} canInvite={canInvite} variant="full" />

        {canInvite && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/staff/roles-permissions?tab=invitations">
                <UserPlus className="h-4 w-4" />
                Inviter du personnel
              </Link>
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
