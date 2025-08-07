'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import FollowUpTable from '@/components/mom/FollowUpTable';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FollowUpPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/api/auth/signin');
  }

  const userRole = session?.user?.role as 'employee' | 'approver' | 'checker' | 'admin' || 'employee';

  return (
    <div className="min-h-screen bg-background">
      <Header variant={userRole} />
      
      <div className="flex">
        <Sidebar userRole={userRole} />
        
        <main className={cn(
          "flex-1 transition-all duration-200",
          "md:ml-64",
          "p-6"
        )}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-lato">Follow-up Tasks</h1>
                  <p className="text-muted-foreground font-nunito mt-1">
                    Track and manage action items from meetings and discussions
                  </p>
                </div>
              </div>
            </div>
            
            {/* Follow-up Table */}
            <FollowUpTable 
              userId={session.user?.id || undefined} 
              userName={session.user?.name || undefined} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}