import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { Users, UserPlus, Mail } from 'lucide-react'
import Link from 'next/link'
import { ROLE_LABELS, ROLE_COLORS, STAFF_ROLES } from '@/types/roles'
import { getInitials, formatDate } from '@/lib/utils'
import type { UserRole } from '@/types/roles'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestion du personnel',
}

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const schoolRole = await getUserSchoolContext(user.id)

  const { data: staffMembersRaw, count } = await supabase
    .from('user_school_roles')
    .select(`
      id, role_code, is_active, created_at,
      profiles (id, full_name, email, phone, avatar_url, is_active)
    `, { count: 'exact' })
    .eq('school_id', schoolRole?.school_id ?? '')
    .in('role_code', STAFF_ROLES)
    .order('created_at', { ascending: false })

  const staffMembers = staffMembersRaw as Array<{
    id: string; role_code: string; is_active: boolean; created_at: string;
    profiles: { id: string; full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null; is_active: boolean } | null;
  }> | null

  const roleGroups = STAFF_ROLES.reduce((acc, role) => {
    acc[role] = staffMembers?.filter(s => s.role_code === role).length ?? 0
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Personnel"
        description={`${count ?? 0} membre${(count ?? 0) > 1 ? 's' : ''} du personnel`}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f] sm:w-auto" asChild>
              <Link href="/dashboard/staff/roles-permissions?tab=invitations">
                <UserPlus className="h-4 w-4" />
                Inviter du personnel
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/staff/roles-permissions">
                Rôles & permissions
              </Link>
            </Button>
          </div>
        }
      />

      {/* Répartition par rôle */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAFF_ROLES.map(role => (
          <div key={role} className="bg-white rounded-xl border p-3 text-center">
            <p className="text-2xl font-bold text-[#1a4d2e]">{roleGroups[role]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[role as UserRole]}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Équipe pédagogique et administrative</CardTitle>
        </CardHeader>
        <CardContent>
          {staffMembers && staffMembers.length > 0 ? (
            <>
              <div className="divide-y sm:hidden">
                {staffMembers.map(member => {
                  const profile = member.profiles
                  return (
                    <div key={member.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(profile?.full_name ?? 'U')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{profile?.full_name ?? '—'}</p>
                          <p className="truncate text-xs text-muted-foreground">{profile?.email ?? '—'}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className={ROLE_COLORS[member.role_code as UserRole]}>
                          {ROLE_LABELS[member.role_code as UserRole]}
                        </Badge>
                        <Badge variant={member.is_active ? 'success' : 'secondary'}>
                          {member.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Depuis {formatDate(member.created_at)}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nom</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rôle</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Téléphone</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Depuis</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(member => {
                    const profile = member.profiles as any
                    return (
                      <tr key={member.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {getInitials(profile?.full_name ?? 'U')}
                            </div>
                            <span className="font-medium">{profile?.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge className={ROLE_COLORS[member.role_code as UserRole]}>
                            {ROLE_LABELS[member.role_code as UserRole]}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          {profile?.email ? (
                            <a href={`mailto:${profile.email}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Mail className="h-3 w-3" />
                              {profile.email}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {profile?.phone ?? '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={member.is_active ? 'success' : 'secondary'}>
                            {member.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {formatDate(member.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">Aucun personnel enregistré</p>
              <Button variant="outline" className="mt-3" asChild>
                <Link href="/dashboard/staff/roles-permissions?tab=invitations">Inviter du personnel</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
