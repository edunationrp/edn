'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useTopbarUnreadCounts } from '@/components/layout/use-topbar-unread'
import { WatermarkBackground } from '@/components/schools/watermark-background'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'edunation-sidebar-collapsed'

type ShellProps = {
  children: React.ReactNode
  schoolLogoUrl?: string | null
  schoolWatermarkOpacity?: number | null
  sidebar: Omit<React.ComponentProps<typeof Sidebar>, 'collapsed' | 'mobileOpen' | 'onNavigate'>
  topbar: Omit<React.ComponentProps<typeof Topbar>, 'collapsed' | 'onMenuClick' | 'onToggleSidebar'> & {
    userId?: string
  }
}

export function DashboardShell({
  children,
  schoolLogoUrl,
  schoolWatermarkOpacity,
  sidebar,
  topbar,
}: ShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { userId, unreadMessages, unreadNotifications, ...topbarProps } = topbar
  const liveUnread = useTopbarUnreadCounts(
    {
      messages: unreadMessages ?? 0,
      notifications: unreadNotifications ?? 0,
    },
    userId ?? ''
  )

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
    } catch {
      // ignore
    }
  }, [])

  function toggleSidebarCollapsed() {
    setSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <div className="no-print contents">
        <Sidebar
          {...sidebar}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="no-print fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-[margin] duration-200',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        )}
      >
        <div className="no-print contents">
          <Topbar
            {...topbarProps}
            unreadMessages={liveUnread.messages}
            unreadNotifications={liveUnread.notifications}
            collapsed={sidebarCollapsed}
            onMenuClick={() => setMobileNavOpen(true)}
            onToggleSidebar={toggleSidebarCollapsed}
          />
        </div>
        <main className="relative mt-14 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:px-8 lg:py-7 print:mt-0 print:overflow-visible print:p-0">
          <div className="no-print contents">
            <WatermarkBackground logoUrl={schoolLogoUrl} opacity={schoolWatermarkOpacity} />
          </div>
          <div className="relative z-[1]">{children}</div>
        </main>
      </div>
    </div>
  )
}
