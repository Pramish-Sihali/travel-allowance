import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PageLayout from '@/components/layout/PageLayout';
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
    <PageLayout
      title="Valley Requests"
      description="Submit and manage your in-valley travel requests"
      headerIcon={<Mountain className="h-6 w-6 text-primary" />}
      userRole={userRole}
    >
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
    </PageLayout>
  );
}