// app/tasks/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TaskManager from '@/components/tasks/TaskManager';
import PageLayout from '@/components/layout/PageLayout';
import { CheckSquare } from 'lucide-react';

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = session.user.role as 'employee' | 'approver' | 'checker' | 'admin';

  return (
    <PageLayout
      title="Project Manager"
      description="Track and manage projects across different departments with action items and time tracking"
      headerIcon={<CheckSquare className="h-6 w-6 text-primary" />}
      userRole={userRole}
    >
      <TaskManager />
    </PageLayout>
  );
}