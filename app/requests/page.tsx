import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Travel Requests</h1>
            <p className="text-muted-foreground">Submit and manage your travel requests</p>
          </div>
        </div>
        
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-primary" />
                    New Travel Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Submit a new travel request for business trips and expenses
                  </p>
                  <Link href="/employee/requests/new">
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
                    My Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    View and track all your submitted travel requests
                  </p>
                  {userRole === 'employee' ? (
                    <Link href="/employee/requests">
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
                    Check status updates and approvals on your requests
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    View Activity
                  </Button>
                </CardContent>
              </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}