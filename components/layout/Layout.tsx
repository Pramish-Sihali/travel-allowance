'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  className?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function Layout({ 
  children, 
  requireAuth = true,
  allowedRoles,
  className,
  showSidebar = true,
  showHeader = true,
  showFooter = false
}: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  
  // Handle authentication and authorization
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (requireAuth && !session) {
      router.push('/');
      return;
    }
    
    if (allowedRoles && session?.user?.role && !allowedRoles.includes(session.user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, requireAuth, allowedRoles, router]);

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if auth is required but user is not authenticated
  if (requireAuth && !session) {
    return null;
  }

  // Don't render if user doesn't have required role
  if (allowedRoles && session?.user?.role && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  const userRole = session?.user?.role as 'employee' | 'approver' | 'checker' | 'admin' || 'employee';

  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header variant={userRole} />}
      
      <div className="flex min-h-screen">
        {showSidebar && <Sidebar userRole={userRole} />}
        
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          showSidebar && (isCollapsed ? "md:ml-16" : "md:ml-64"),
          className
        )}>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 p-4 md:p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
            
            {showFooter && <Footer />}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}

// Specialized Layout Components
export function AuthLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Layout 
      requireAuth={false} 
      showSidebar={false} 
      showHeader={false} 
      showFooter={true}
      className={cn("items-center justify-center p-4", className)}
    >
      {children}
    </Layout>
  );
}

export function DashboardLayout({ 
  children, 
  allowedRoles,
  className 
}: { 
  children: ReactNode; 
  allowedRoles?: string[];
  className?: string;
}) {
  return (
    <Layout 
      requireAuth={true} 
      allowedRoles={allowedRoles}
      showSidebar={true} 
      showHeader={true}
      className={className}
    >
      {children}
    </Layout>
  );
}

export function AdminLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DashboardLayout 
      allowedRoles={['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN']}
      className={className}
    >
      {children}
    </DashboardLayout>
  );
}

export function ManagerLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DashboardLayout 
      allowedRoles={['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN']}
      className={className}
    >
      {children}
    </DashboardLayout>
  );
}