// app/tasks/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TaskManager from '@/components/tasks/TaskManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  // Determine dashboard URL based on user role
  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'approver':
        return '/approver/dashboard';
      case 'checker':
        return '/checker/dashboard';
      default:
        return '/employee/dashboard';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-full lg:px-8 xl:px-12">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={getDashboardUrl(session.user.role)}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Task Manager</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage tasks across different departments and projects
        </p>
      </div>
      
      <TaskManager />
    </div>
  );
}