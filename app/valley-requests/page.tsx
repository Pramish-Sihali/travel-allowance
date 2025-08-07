import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mountain, Plus, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ValleyRequestsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = session.user.role as 'employee' | 'approver' | 'checker' | 'admin';

  return (
    <div className="min-h-screen bg-background">
      <Header variant={userRole} />
      
      <div className="flex">
        <Sidebar userRole={userRole} />
        
        <main className={cn(
          "flex-1 transition-all duration-200",
          "md:ml-64",
          "p-6"
        )}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mountain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-lato">Valley Requests</h1>
                  <p className="text-muted-foreground font-nunito mt-1">
                    Submit and manage your in-valley travel requests
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-primary" />
                    New Valley Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Submit a new in-valley travel request for local trips
                  </p>
                  <Link href="/employee/requests/in-valley">
                    <Button className="w-full">
                      Create New Request
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    My Valley Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    View and track all your submitted in-valley requests
                  </p>
                  {userRole === 'employee' ? (
                    <Link href="/employee/dashboard">
                      <Button variant="outline" className="w-full">
                        View My Requests
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/${userRole}/dashboard`}>
                      <Button variant="outline" className="w-full">
                        View All Requests
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Check status updates and approvals on your valley requests
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    View Activity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}