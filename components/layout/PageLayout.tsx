'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerIcon?: ReactNode;
  userRole?: 'employee' | 'approver' | 'checker' | 'admin';
  className?: string;
}

export default function PageLayout({ 
  children, 
  title, 
  description, 
  headerIcon, 
  userRole,
  className 
}: PageLayoutProps) {
  const { data: session } = useSession();
  const { isCollapsed } = useSidebar();
  
  const role = userRole || (session?.user?.role as 'employee' | 'approver' | 'checker' | 'admin') || 'employee';

  return (
    <div className="min-h-screen bg-background">
      <Header variant={role} />
      
      <div className="flex">
        <Sidebar userRole={role} />
        
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          // Responsive margin based on sidebar state
          isCollapsed ? "md:ml-16" : "md:ml-64",
          "p-4 md:p-6",
          className
        )}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            {(title || description) && (
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-3 mb-4">
                  {headerIcon && (
                    <div className="p-2 rounded-lg bg-primary/10">
                      {headerIcon}
                    </div>
                  )}
                  <div className="flex-1">
                    {title && (
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground font-lato">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="text-muted-foreground font-nunito mt-1 text-sm md:text-base">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}