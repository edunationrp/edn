'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

type ShellProps = {
  children: React.ReactNode
  sidebar: React.ComponentProps<typeof Sidebar>
  topbar: React.ComponentProps<typeof Topbar>
}

export function DashboardShell({ children, sidebar, topbar }: ShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar
        {...sidebar}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:ml-[240px]">
        <Topbar {...topbar} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mt-14 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
