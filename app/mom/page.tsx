import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { authOptions } from '@/lib/auth';
import MomDashboard from '@/components/mom/MomDashboard';
import PageLayout from '@/components/layout/PageLayout';
import { Users } from 'lucide-react';

export default async function MomPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = session.user.role as 'employee' | 'approver' | 'checker' | 'admin';

  return (
    <PageLayout
      title="Meeting Minutes"
      description="Create, manage, and track meeting minutes with action items and follow-ups"
      headerIcon={<Users className="h-6 w-6 text-primary" />}
      userRole={userRole}
    >
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <MomDashboard />
      </Suspense>
    </PageLayout>
  );
}