import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LeaveRequestsDashboard from '@/components/leave/LeaveRequestsDashboard';

export default async function LeaveRequestsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  return <LeaveRequestsDashboard />;
}