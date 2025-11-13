import { Open_Sans } from 'next/font/google';
import ClientRoot from './ClientRoot';
import './globals.css';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Attendance Pro",
  description: "Employee attendance management system",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientRoot>
          {children}
        </ClientRoot>
        <Toaster />
      </body>
    </html>
  );
}
