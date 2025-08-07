import './globals.css';
import type { Metadata } from 'next';
import { Lato, Nunito } from 'next/font/google';
import SessionProvider from '@/components/auth/SessionProvider';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'IXI Employee Portal',
  description: 'A system for managing travel allowance requests and approvals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lato.variable} ${nunito.variable} font-sans`}>
      <body>
        <SessionProvider>
          <NotificationProvider>
            <ProjectProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </ProjectProvider>
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}