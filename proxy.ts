import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
  const isPublicPage = pathname === '/login' || pathname === '/teacher-signup'

  if (!user && !isPublicPage) {
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (user) {
    // Use an Admin client to bypass RLS for role checking in middleware
    // This is safer and more reliable for routing logic
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey!)
    
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const isTeacher = teacher?.role === 'teacher'

    if (isPublicPage) {
      return NextResponse.redirect(new URL(isTeacher ? '/teacher/attendance' : '/dashboard', request.url))
    }

    if (!pathname.startsWith('/api')) {
      if (isTeacher) {
        // Teachers can ONLY access /teacher/* routes
        if (!pathname.startsWith('/teacher')) {
          return NextResponse.redirect(new URL('/teacher/attendance', request.url))
        }
      } else {
        // Admins can access everything EXCEPT /teacher/*
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