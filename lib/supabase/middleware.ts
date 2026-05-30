import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { isParentPortalUser } from '@/lib/parent/is-parent-user'

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
  const isTuteurRoute = pathname === '/tuteur' || pathname.startsWith('/tuteur/')
  const isApiRoute = pathname.startsWith('/api')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isEleveRoute = pathname.startsWith('/eleve')
  const isParentRoute = pathname === '/parent' || pathname.startsWith('/parent/')
  const isStudentLoginRoute = pathname.startsWith('/login/eleve')
  const isParentLoginRoute = pathname.startsWith('/login/parent')
  const isAllowedPublic =
    isPublicRoute || isRegisterRoute || isJoinRoute ||
    isSuperAdminSetupRoute || isParentSimpleRoute || isTuteurRoute || isApiRoute ||
    isStudentLoginRoute || isParentLoginRoute

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

  if (!user && isParentRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/parent'
    return NextResponse.redirect(url)
  }

  let isStudentAccount = false
  let isParentAccount = false

  if (user && (isDashboardRoute || isEleveRoute || isParentRoute || isParentLoginRoute || isStudentLoginRoute)) {
    const { data: studentRow } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    isStudentAccount = Boolean(studentRow)
    if (!isStudentAccount) {
      isParentAccount = await isParentPortalUser(supabase, user.id)
    }
  }

  // Bloquer l'accès des élèves au /dashboard/*
  if (user && isDashboardRoute && isStudentAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/eleve'
    return NextResponse.redirect(url)
  }

  // Rediriger les parents vers le portail dédié
  if (user && isDashboardRoute && isParentAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/parent'
    return NextResponse.redirect(url)
  }

  if (user && isParentRoute && isStudentAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/eleve'
    return NextResponse.redirect(url)
  }

  if (user && isEleveRoute && isParentAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/parent'
    return NextResponse.redirect(url)
  }

  // Rediriger login parent → portail parent si déjà connecté (non-élève)
  if (user && isParentLoginRoute && !isStudentAccount) {
    const url = request.nextUrl.clone()
    url.pathname = isParentAccount ? '/parent' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rediriger login standard → dashboard pour les non-élèves authentifiés
  if (user && pathname === '/login' && !isStudentLoginRoute && !isParentLoginRoute) {
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
