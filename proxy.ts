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
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/teacher-signup' || pathname === '/teacher-login' || pathname === '/sitemap.xml' || pathname === '/robots.txt'

  if (!user && !isPublicPage) {
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (user) {
    // Use native fetch to bypass RLS with Service Key without breaking Edge runtime in Turbopack
    let userRole = 'admin';
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/teachers?select=role&auth_user_id=eq.${user.id}`, {
        headers: {
          'apikey': supabaseServiceKey!,
          'Authorization': `Bearer ${supabaseServiceKey!}`
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        userRole = data[0].role;
      }
    } catch (err) {
      console.error('Error fetching teacher role in middleware:', err);
    }

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
