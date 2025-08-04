import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TaskDetailPage from '@/components/tasks/TaskDetailPage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="container mx-auto p-6 max-w-full lg:px-8 xl:px-12">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Task Details</h1>
        <p className="text-muted-foreground mt-2">
          View and manage task progress, add time logs and updates
        </p>
      </div>
      
      <TaskDetailPage taskId={id} />
    </div>
  );
}