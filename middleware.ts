import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        'or SUPABASE_URL and SUPABASE_ANON_KEY to your environment.'
    )
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublicPage = pathname === '/login' || pathname === '/teacher-signup'

  if (!user && !isPublicPage) {
    // Exclude API routes from redirecting to login to avoid breaking webhooks/fetch calls
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (user) {
    // Check role from teachers table
    const { data: teacher } = await supabase
      .from('teachers')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const isTeacher = teacher?.role === 'teacher'

    if (isPublicPage) {
      return NextResponse.redirect(new URL(isTeacher ? '/teacher/attendance' : '/dashboard', request.url))
    }

    // Only apply role restrictions to page routes, not API routes
    if (!pathname.startsWith('/api')) {
      if (isTeacher) {
        // If user is teacher → only allow /teacher/* routes
        if (!pathname.startsWith('/teacher')) {
          return NextResponse.redirect(new URL('/teacher/attendance', request.url))
        }
      } else {
        // If user is admin → prevent accessing /teacher/*
        if (pathname.startsWith('/teacher')) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}