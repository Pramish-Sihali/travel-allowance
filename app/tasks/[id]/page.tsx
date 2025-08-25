import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TaskDetailPage from '@/components/tasks/TaskDetailPage';
import PageLayout from '@/components/layout/PageLayout';
import { CheckSquare } from 'lucide-react';

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskDetail({ params }: TaskDetailPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  const { id } = await params;
  const userRole = session.user.role as 'employee' | 'approver' | 'checker' | 'admin';

  return (
    <PageLayout
      title="Task Details"
      description="View and manage task progress, action items, and team collaboration"
      headerIcon={<CheckSquare className="h-6 w-6 text-primary" />}
      userRole={userRole}
    >
      <TaskDetailPage taskId={id} />
    </PageLayout>
  );
}