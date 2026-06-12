import { SuperAdminDashboard } from '@/features/dashboard/super-admin-dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vue plateforme — EduNation',
}

export default async function PlatformOverviewPage() {
  return <SuperAdminDashboard />
}
