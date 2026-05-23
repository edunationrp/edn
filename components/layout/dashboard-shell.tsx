'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'edunation-sidebar-collapsed'

type ShellProps = {
  children: React.ReactNode
  sidebar: Omit<React.ComponentProps<typeof Sidebar>, 'collapsed' | 'mobileOpen' | 'onNavigate' | 'onToggleCollapse'>
  topbar: Omit<React.ComponentProps<typeof Topbar>, 'collapsed' | 'onMenuClick' | 'onToggleSidebar'>
}

export function DashboardShell({ children, sidebar, topbar }: ShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar
        {...sidebar}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-[margin] duration-200',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        )}
      >
        <Topbar
          {...topbar}
          collapsed={sidebarCollapsed}
          onMenuClick={() => setMobileNavOpen(true)}
          onToggleSidebar={toggleSidebarCollapsed}
        />
        <main className="mt-14 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
