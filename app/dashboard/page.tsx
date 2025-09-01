'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingState from '@/components/common/LoadingState';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/');
      return;
    }

    // Redirect based on user role
    const role = session.user?.role;
    
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      case 'HR_ADMIN':
        router.push('/admin/dashboard'); // HR admins can use admin dashboard
        break;
      case 'APPROVER':
        router.push('/approver/dashboard');
        break;
      case 'CHECKER':
        router.push('/checker/dashboard');
        break;
      case 'EMPLOYEE':
      case 'MANAGER':
      case 'FINANCE':
      default:
        router.push('/employee/dashboard');
        break;
    }
  }, [session, status, router]);

  // Show loading state while redirecting
  if (status === 'loading') {
    return <LoadingState />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingState />
    </div>
  );
}