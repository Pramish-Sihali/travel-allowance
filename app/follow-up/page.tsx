import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PageLayout from '@/components/layout/PageLayout';
import UserFollowUpDashboard from '@/components/follow-up/UserFollowUpDashboard';
import { CheckSquare } from 'lucide-react';

export default async function FollowUpPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = session.user.role as 'employee' | 'approver' | 'checker' | 'admin';

  return (
    <PageLayout
      title="My Follow-up Tasks"
      description="Track and manage your personal action items from meetings and discussions"
      headerIcon={<CheckSquare className="h-6 w-6 text-primary" />}
      userRole={userRole}
    >
      <UserFollowUpDashboard 
        userId={session.user.id} 
        userName={session.user.name || session.user.email || 'User'} 
      />
    </PageLayout>
  );
}