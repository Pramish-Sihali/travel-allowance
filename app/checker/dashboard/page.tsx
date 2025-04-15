'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CheckerDashboard from '@/components/dashboard/CheckerDashboard';
import { useSession } from "next-auth/react";
import Header from '@/components/layout/Header';

export default function CheckerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect if not checker or admin (as fallback)
  useEffect(() => {
    if (status === 'authenticated' && 
        !['checker', 'admin'].includes(session?.user?.role || '')) {
      router.push('/');
    }
  }, [session, status, router]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="checker" />
      
      <main className="flex-grow p-6">
        <CheckerDashboard />
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}