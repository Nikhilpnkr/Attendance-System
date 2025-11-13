"use client"

import { usePathname } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AuthProvider>
      <Navbar hidden={pathname === '/login'} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Toaster />
    </AuthProvider>
  );
}
