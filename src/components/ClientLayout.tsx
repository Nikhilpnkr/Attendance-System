"use client"

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <Navbar hidden={pathname === '/login'} />
      {children}
    </>
  );
}
