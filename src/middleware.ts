import { createBrowserClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase env variables not configured')
      return response
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            request.cookies.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      if (request.nextUrl.pathname.startsWith('/admin')) {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (!user || authError) {
          return NextResponse.redirect(new URL('/login', request.url))
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || profile?.role !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
      
      return response
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/error', request.url))
    }
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*']
}
