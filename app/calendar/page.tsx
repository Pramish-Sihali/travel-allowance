// app/calendar/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import CompanyCalendar from '@/components/calendar/CompanyCalendar';
import { DashboardLayout } from '@/components/layout/Layout';
import { Calendar } from 'lucide-react';

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Company Calendar</h1>
            <p className="text-muted-foreground">View company events, meetings, and important dates. Plan your schedule effectively.</p>
          </div>
        </div>
        <CompanyCalendar />
      </div>
    </DashboardLayout>
  );
}