"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { Home, FileText, BarChart3, Coffee, Settings, Menu, X, Briefcase, Shield, LogOut } from 'lucide-react'
import NotificationCenter from '@/components/NotificationCenter'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<{
    role?: 'employee' | 'assistant' | 'manager' | 'admin'
    full_name?: string
    employee_id?: string
    avatar_url?: string
  } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user || !user.id) {
          console.log('No user or user ID available')
          return
        }
        
        console.log('Loading profile for user:', user.id)
        
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        console.log('Supabase client created, fetching profile...')
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Supabase error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          return
        }
        
        if (!data) {
          console.error('No profile data returned')
          return
        }
        
        console.log('Profile data loaded:', data)
        
        setProfile({
          role: data.role,
          full_name: data.full_name,
          employee_id: data.employee_id,
          avatar_url: data.avatar_url
        })
        
      } catch (error: unknown) {
        console.error('Unexpected error in loadProfile:', {
          error,
          name: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }
    
    // Add a small delay to ensure auth is fully initialized
    const timer = setTimeout(() => {
      loadProfile()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [user])

  const linkCls = (href: string) => `text-gray-600 hover:text-gray-900 ${pathname === href ? 'font-semibold' : ''}`

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <Link href="/" className="text-xl font-semibold text-gray-900">Attendance Pro</Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Button variant="ghost" size="sm" className={linkCls('/')}> 
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className={linkCls('/history')} asChild>
                <Link href="/history">
                  <FileText className="h-4 w-4 mr-2" />
                  History
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className={linkCls('/analytics')} asChild>
                <Link href="/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className={linkCls('/leave')} asChild>
                <Link href="/leave">
                  <Coffee className="h-4 w-4 mr-2" />
                  Leave
                </Link>
              </Button>
              {profile?.role === 'admin' && (
                <Button variant="ghost" size="sm" className={linkCls('/admin')} asChild>
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className={linkCls('/profile')} asChild>
                <Link href="/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user?.email || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || user?.email}</p>
                {profile?.employee_id && (
                  <p className="text-xs text-gray-500">ID: {profile.employee_id}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50">
          <div className="bg-white w-64 h-full shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/" onClick={() => setMobileOpen(false)}>
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/history" onClick={() => setMobileOpen(false)}>
                    <FileText className="h-4 w-4 mr-2" />
                    History
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/analytics" onClick={() => setMobileOpen(false)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/leave" onClick={() => setMobileOpen(false)}>
                    <Coffee className="h-4 w-4 mr-2" />
                    Leave
                  </Link>
                </Button>
                {profile?.role === 'admin' && (
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
