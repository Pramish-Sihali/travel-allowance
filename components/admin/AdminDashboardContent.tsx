// This adds a settings button to the AdminDashboardContent component

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  DollarSign,
  BarChart,
  Bell,
  CheckSquare,
  AlertTriangle,
  UserCircle,
  Settings,
} from 'lucide-react';

import AdminUsersTable from './AdminUsersTable';
import AdminRequestsTable from './AdminRequestsTable';
import AdminStatistics from './AdminStatistics';

interface AdminDashboardContentProps {
  user: any;
}

interface AdminStats {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  usersByRole: {
    employee: number;
    approver: number;
    checker: number;
    admin: number;
  };
  requestsByMonth: Array<{
    month: string;
    pending: number;
    approved: number;
    rejected: number;
    amount: number;
  }>;
  departmentData: Array<{
    name: string;
    requests: number;
    amount: number;
  }>;
}

export default function AdminDashboardContent({ user }: AdminDashboardContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0,
    usersByRole: {
      employee: 0,
      approver: 0,
      checker: 0,
      admin: 0
    },
    requestsByMonth: [],
    departmentData: []
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch admin statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const handleNavigateToSettings = () => {
    router.push('/admin/settings');
  };
  
  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
  
  if (isLoading) {
    return renderSkeleton();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        
        {/* Added Settings Button */}
        <Button 
          variant="outline"
          onClick={handleNavigateToSettings}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          System Settings
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold">Nrs.{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <BarChart className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                  {stats.pendingRequests > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
                      Needs action
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>System Management</CardTitle>
          <CardDescription>
            Manage users, requests, and view system statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b">
              <TabsList className="w-full grid grid-cols-1 md:grid-cols-3 h-auto p-0 bg-transparent">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                  <BarChart className="h-4 w-4 mr-2" />
                  Overview & Statistics
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                  <FileText className="h-4 w-4 mr-2" />
                  Request Management
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="m-0 p-6">
              <AdminStatistics stats={stats} />
            </TabsContent>
            
            <TabsContent value="users" className="m-0 p-6">
              <AdminUsersTable />
            </TabsContent>
            
            <TabsContent value="requests" className="m-0 p-6">
              <AdminRequestsTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Settings Card with Quick Links */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Quick Settings
          </CardTitle>
          <CardDescription>
            Configure system settings and manage projects
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-3 border-dashed"
              onClick={handleNavigateToSettings}
            >
              <Settings className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="font-medium">System Settings</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage projects, budgets and configurations
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}