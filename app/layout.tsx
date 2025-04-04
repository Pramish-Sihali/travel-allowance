import './globals.css';
import type { Metadata } from 'next';
import { Lexend_Deca } from 'next/font/google';

const lexendDeca = Lexend_Deca({
  subsets: ['latin'],
  weight: '400', // adjust as needed
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
      <body>{children}</body>
    </html>
  );
}
