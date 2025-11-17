"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { Home, FileText, BarChart3, Coffee, Settings, Menu, X, Briefcase, Shield, LogOut, Sun, Moon } from 'lucide-react'
import NotificationCenter from '@/components/NotificationCenter'
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ErrorBoundary } from 'react-error-boundary';

export default function Navbar({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{full_name?: string, employee_id?: string, role?: string} | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  interface AttendanceSummary {
    days_present?: number;
    days_absent?: number;
    period_start?: string;
  }

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!user || !isMounted) return;
        
        setIsLoading(true);

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, employee_id, role')
          .eq('id', user.id)
          .single();

        if (!isMounted) return;
        if (error) throw error;

        setProfile(data);
      } catch (error) {
        console.error('Profile load error:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false };
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('theme');
    let initial: 'light' | 'dark' = 'light';

    if (stored === 'light' || stored === 'dark') {
      initial = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initial = 'dark';
    }

    setTheme(initial);
    const root = document.documentElement;
    if (initial === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        if (next === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        window.localStorage.setItem('theme', next);
      }
      return next;
    });
  }

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_summaries')
        .select('*')
        .eq('period_type', 'monthly')
        .like('period_start', `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2, '0')}%`);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return null;
    }
  }

  const linkCls = (href: string) => `text-muted-foreground hover:text-foreground ${pathname === href ? 'font-semibold' : ''}`

  return (
    <header className="bg-background/80 backdrop-blur shadow-sm border-b sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <Link href="/" className="text-xl font-semibold text-foreground">Attendance Pro</Link>
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <NotificationCenter />
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-3">
              {isLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {profile?.full_name || user?.email?.split('@')[0]}
                    </p>
                    {profile?.employee_id && (
                      <p className="text-sm text-muted-foreground">
                        {profile.employee_id}
                      </p>
                    )}
                  </div>
                  <ErrorBoundary fallbackRender={() => null}>
                    {!isLoading && attendance && (
                      <div className="text-sm text-muted-foreground">
                        {attendance.days_present} days present this month
                      </div>
                    )}
                  </ErrorBoundary>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50">
          <div className="bg-background w-64 h-full shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 mr-2" />
                  ) : (
                    <Moon className="h-4 w-4 mr-2" />
                  )}
                  Toggle theme
                </Button>
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
