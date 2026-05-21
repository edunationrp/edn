import { AttendanceTakeClient } from '@/features/attendance/attendance-take-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prise de présence',
}

export default function AttendanceTakePage() {
  return <AttendanceTakeClient />
}
