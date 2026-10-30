import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.')
  }

  const pathname = request.nextUrl.pathname
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/teacher-signup' || pathname === '/teacher-login' || pathname === '/sitemap.xml' || pathname === '/robots.txt'

  // Fast-path for authenticated client-side navigation (RSC requests)
  // When a user is already browsing the app, avoid redundant remote Supabase network roundtrips on every click!
  const isRsc = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc')
  const cachedRole = request.cookies.get('user-role')?.value
  console.log(`[PROXY] pathname: ${pathname}, isRsc: ${isRsc}, cachedRole: ${cachedRole}`)

  if (isRsc && cachedRole) {
    // Validate role permissions locally in 0ms without remote fetch
    if (cachedRole === 'teacher' && !pathname.startsWith('/teacher')) {
      return NextResponse.redirect(new URL('/teacher/attendance', request.url))
    }
    if (cachedRole === 'attendance_staff' && !pathname.startsWith('/student-attendance')) {
      return NextResponse.redirect(new URL('/student-attendance', request.url))
    }
    if (cachedRole === 'admin' && (pathname.startsWith('/teacher') || pathname.startsWith('/student-attendance'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Allowed - return response instantly (0ms network delay)
    return supabaseResponse
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

  if (!user && !isPublicPage) {
    if (!pathname.startsWith('/api')) {
      supabaseResponse.cookies.delete('user-role')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (user) {
    let userRole = cachedRole
    if (!userRole) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/teachers?select=role&auth_user_id=eq.${user.id}`, {
          headers: {
            'apikey': supabaseServiceKey!,
            'Authorization': `Bearer ${supabaseServiceKey!}`
          }
        });
        const data = await res.json();
        userRole = (data && data.length > 0) ? data[0].role : 'admin';
      } catch (err) {
        userRole = 'admin';
      }
    }

    // Persist role in cookie so subsequent route navigations take 0ms
    supabaseResponse.cookies.set('user-role', userRole || 'admin', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      httpOnly: true
    })

    if (isPublicPage) {
      if (userRole === 'teacher') return NextResponse.redirect(new URL('/teacher/attendance', request.url))
      if (userRole === 'attendance_staff') return NextResponse.redirect(new URL('/student-attendance', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!pathname.startsWith('/api')) {
      if (userRole === 'teacher') {
        if (!pathname.startsWith('/teacher')) {
          return NextResponse.redirect(new URL('/teacher/attendance', request.url))
        }
      } else if (userRole === 'attendance_staff') {
        if (!pathname.startsWith('/student-attendance')) {
          return NextResponse.redirect(new URL('/student-attendance', request.url))
        }
      } else {
        // Admins can access everything EXCEPT /teacher/* and /student-attendance/*
        if (pathname.startsWith('/teacher') || pathname.startsWith('/student-attendance')) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)'],
}
