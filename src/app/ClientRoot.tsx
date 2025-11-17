"use client"

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Global theme initializer: read themeMode and apply effective theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyTheme = (mode: 'system' | 'light' | 'dark') => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
      const root = document.documentElement;
      if (effective === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    const readMode = (): 'system' | 'light' | 'dark' => {
      const stored = window.localStorage.getItem('themeMode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return 'system';
    };

    // Initial apply (first visit: follows system; later: uses saved mode)
    applyTheme(readMode());

    // Keep in sync with OS changes while in system mode
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const current = readMode();
      if (current === 'system') {
        applyTheme('system');
      }
    };

    media.addEventListener('change', listener);
    return () => {
      media.removeEventListener('change', listener);
    };
  }, []);
  
  return (
    <AuthProvider>
      {pathname !== '/login' && <Navbar />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </AuthProvider>
  );
}
