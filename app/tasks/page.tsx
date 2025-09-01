// app/tasks/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TaskManager from '@/components/tasks/TaskManager';
import { DashboardLayout } from '@/components/layout/Layout';
import { CheckSquare } from 'lucide-react';

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Project Manager</h1>
            <p className="text-muted-foreground">Track and manage projects across different departments with action items and time tracking</p>
          </div>
        </div>
        <TaskManager />
      </div>
    </DashboardLayout>
  );
}