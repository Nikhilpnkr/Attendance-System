"use client"

import { usePathname } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AuthProvider>
      <Navbar hidden={pathname === '/login'} />
      {children}
      <Toaster />
    </AuthProvider>
  );
}
