import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { authOptions } from '@/lib/auth';
import MomDashboard from '@/components/mom/MomDashboard';
import { DashboardLayout } from '@/components/layout/Layout';
import { Users } from 'lucide-react';

export default async function MomPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Meeting Minutes</h1>
            <p className="text-muted-foreground">Create, manage, and track meeting minutes with action items and follow-ups</p>
          </div>
        </div>
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
          <MomDashboard />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}