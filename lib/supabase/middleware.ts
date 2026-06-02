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

  const isApiRoute = pathname.startsWith('/api')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isEleveRoute = pathname.startsWith('/eleve')
  const isParentRoute = pathname === '/parent' || pathname.startsWith('/parent/')
  const isStudentLoginRoute = pathname.startsWith('/login/eleve')
  const isParentLoginRoute = pathname.startsWith('/login/parent')
  const isSuspendedRoute = pathname === '/suspended'

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
  let isSuspendedAccount = false

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

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: suspensionCtxRaw } = await (supabase as any).rpc('get_my_suspension_context')
    const suspensionCtx = (suspensionCtxRaw as Array<{
      account_blocked: boolean
      school_blocked: boolean
    }> | null)?.[0]
    isSuspendedAccount = Boolean(suspensionCtx?.account_blocked || suspensionCtx?.school_blocked)
  }

  if (user && isSuspendedAccount && !isSuspendedRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/suspended'
    return NextResponse.redirect(url)
  }

  if (user && isSuspendedRoute && !isSuspendedAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Bloquer l'accès des élèves au /dashboard/*
  if (user && isDashboardRoute && isStudentAccount && !isSuspendedAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/eleve'
    return NextResponse.redirect(url)
  }

  // Rediriger les parents vers le portail dédié
  if (user && isDashboardRoute && isParentAccount && !isSuspendedAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/parent'
    return NextResponse.redirect(url)
  }

  if (user && isParentRoute && isStudentAccount && !isSuspendedAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/eleve'
    return NextResponse.redirect(url)
  }

  if (user && isEleveRoute && isParentAccount && !isSuspendedAccount) {
    const url = request.nextUrl.clone()
    url.pathname = '/parent'
    return NextResponse.redirect(url)
  }

  // Rediriger login parent → portail parent si déjà connecté (non-élève)
  if (user && isParentLoginRoute && !isStudentAccount && !isSuspendedAccount) {
    const url = request.nextUrl.clone()
    url.pathname = isParentAccount ? '/parent' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rediriger login standard → dashboard pour les non-élèves authentifiés
  if (user && pathname === '/login' && !isStudentLoginRoute && !isParentLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = isSuspendedAccount ? '/suspended' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rediriger /login/eleve → /eleve pour les élèves déjà connectés
  if (user && isStudentLoginRoute && !isSuspendedAccount) {
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
