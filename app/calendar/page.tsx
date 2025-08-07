// app/calendar/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import CompanyCalendar from '@/components/calendar/CompanyCalendar';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }


  const userRole = session.user.role as 'employee' | 'approver' | 'checker' | 'admin';

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
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-lato">Company Calendar</h1>
                  <p className="text-muted-foreground font-nunito mt-1">
                    View company events, meetings, and important dates. Plan your schedule effectively.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Calendar Component */}
            <CompanyCalendar />
          </div>
        </main>
      </div>
    </div>
  );
}