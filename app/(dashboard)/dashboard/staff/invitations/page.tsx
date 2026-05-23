import { redirect } from 'next/navigation'

export default function StaffInvitationsRedirect() {
  redirect('/dashboard/staff/roles-permissions?tab=invitations')
}
