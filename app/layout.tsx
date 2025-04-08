import './globals.css';
import type { Metadata } from 'next';
import { Lexend_Deca } from 'next/font/google';
import SessionProvider from '@/components/auth/SessionProvider';

const lexendDeca = Lexend_Deca({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lexend-deca',
});

export const metadata: Metadata = {
  title: 'Travel Allowance System',
  description: 'A system for managing travel allowance requests and approvals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lexendDeca.className}>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}