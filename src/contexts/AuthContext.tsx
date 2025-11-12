'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  setupError: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupError, setSetupError] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        // Check if environment variables exist
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          setSetupError(true)
          setLoading(false)
          return
        }

        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Initial user fetch
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setLoading(false)
        if (!user && pathname && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
          router.replace('/login')
        }

        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)

            if (event === 'SIGNED_IN') {
              router.push('/')
            } else if (event === 'SIGNED_OUT') {
              router.push('/login')
            }
          }
        )

        // Effect cleanup
        unsubscribe = () => subscription.unsubscribe()
      } catch (e) {
        console.error('Auth initialization error:', e)
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    loading,
    signOut,
    setupError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}