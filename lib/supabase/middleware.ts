import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes publiques accessibles sans auth
  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/verify-code']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isRegisterRoute = pathname.startsWith('/register')
  const isJoinRoute = pathname.startsWith('/join')
  const isSuperAdminSetupRoute = pathname === '/superadmin'
  const isParentSimpleRoute = pathname.startsWith('/parent-simple')
  const isApiRoute = pathname.startsWith('/api')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isEleveRoute = pathname.startsWith('/eleve')
  const isStudentLoginRoute = pathname.startsWith('/login/eleve')
  const isAllowedPublic =
    isPublicRoute || isRegisterRoute || isJoinRoute ||
    isSuperAdminSetupRoute || isParentSimpleRoute || isApiRoute ||
    isStudentLoginRoute

  // Protéger /dashboard/* et /eleve/* si non authentifié
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (!user && isEleveRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/eleve'
    return NextResponse.redirect(url)
  }

  // Bloquer l'accès des élèves au /dashboard/*
  if (user && isDashboardRoute) {
    const { data: studentRow } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (studentRow) {
      const url = request.nextUrl.clone()
      url.pathname = '/eleve'
      return NextResponse.redirect(url)
    }
  }

  // Rediriger login standard → dashboard pour les non-élèves authentifiés
  if (user && pathname === '/login' && !isStudentLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rediriger /login/eleve → /eleve pour les élèves déjà connectés
  if (user && isStudentLoginRoute) {
    const { data: studentRow } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (studentRow) {
      const url = request.nextUrl.clone()
      url.pathname = '/eleve'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
