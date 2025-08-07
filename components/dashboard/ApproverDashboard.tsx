'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TravelRequest } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LeaveRequestsPanel from '@/components/attendance/LeaveRequestsPanel';
import AttendancePanel from '@/components/attendance/AttendancePanel';

// Import components
import {
  StatsCard,
  DashboardHeader,
  RequestTabs,
  RequestTable,
  EmptyState,
  filterRequests,
  sortRequests,
  toggleSort,
  getRequestDetailRoute
} from '@/components/dashboard';

// Import icons
import {
  Briefcase,
  Clock,
  FileText,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  ClipboardList
} from 'lucide-react';
import { TabsContent } from '@radix-ui/react-tabs';

export default function ApproverDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'normal' | 'in-valley' | 'advance' | 'emergency'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // Stats counters
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    inValleyCount: 0,
    totalAmount: 0
  });


  
  
  useEffect(() => {
    fetchRequests();
  }, []);


  
// Add this function to ApproverDashboard.tsx
const fetchEmployeeDetails = async (requests: any) => {
  const enhancedRequests = [...requests];
  
  for (let i = 0; i < enhancedRequests.length; i++) {
    const req = enhancedRequests[i];
    if (req.employeeId) {
      try {
        const response = await fetch(`/api/user/${req.employeeId}/profile`);
        if (response.ok) {
          const userData = await response.json();
          enhancedRequests[i] = {
            ...req,
            employeeName: userData.name || req.employeeName,
            department: userData.department || req.department,
            designation: userData.designation || req.designation
          };
        }
      } catch (error) {
        console.error(`Error fetching details for employee ${req.employeeId}:`, error);
      }
    }
  }
  
  return enhancedRequests;
};

// Then update your fetchRequests function to use this:
const fetchRequests = async () => {
  try {
    setLoading(true);
    
    // Use optimized dashboard API instead of multiple calls
    const response = await fetch('/api/dashboard/approver');
    
    if (!response.ok) {
      throw new Error('Failed to fetch approver dashboard data');
    }
    
    const data = await response.json();
    console.log('Fetched approver dashboard data:', data);
    
    // Use the data from optimized API
    setRequests(data.allRequests);
    setPendingRequests(data.pendingRequests);
    setCompletedRequests(data.completedRequests);
    
    // Use stats from optimized API
    setStats(data.stats);
  } catch (error) {
    console.error('Error fetching requests:', error);
  } finally {
    setLoading(false);
  }
};
  
  const calculateStats = (data: TravelRequest[]) => {
    const pendingCount = data.filter(req => 
      req.status === 'pending' || req.status === 'travel_approved'
    ).length;
    
    const approvedCount = data.filter(req => 
      req.status === 'approved' || req.status === 'pending_verification'
    ).length;
    
    const rejectedCount = data.filter(req => 
      req.status === 'rejected' || req.status === 'rejected_by_checker'
    ).length;
    
    const inValleyCount = data.filter(req => 
      req.requestType === 'in-valley'
    ).length;
    
    const approvedAmount = data
      .filter(req => req.status === 'approved' || req.status === 'pending_verification')
      .reduce((sum, req) => sum + (req.totalAmount || 0), 0);
    
    setStats({
      pendingCount,
      approvedCount,
      rejectedCount,
      inValleyCount,
      totalAmount: approvedAmount
    });
  };
  
  const handleRefresh = async () => {
    await fetchRequests();
  };
  
  const handleSort = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };
  
  // Apply filters and sorting
  const getFilteredRequests = () => {
    const activeRequests = activeTab === 'pending' ? pendingRequests : completedRequests;
    
    // Apply filters
    const filteredRequests = filterRequests(
      activeRequests,
      searchTerm,
      statusFilter,
      typeFilter
    );
    
    // Apply sorting
    return sortRequests(filteredRequests, sortConfig);
  };
  
  const handleViewDetails = (request: TravelRequest) => {
    const route = getRequestDetailRoute('approver', request.requestType, request.id);
    router.push(route);
  };
  
  const filteredRequests = getFilteredRequests();
  
  // Define the tabs
  const tabs = [
    {
      id: 'pending',
      label: 'Pending Approval',
      icon: Clock,
      count: pendingRequests.length,
      hideTextOnMobile: true
    },
    {
      id: 'completed',
      label: 'Processed Requests',
      icon: FileText,
      count: completedRequests.length,
      hideTextOnMobile: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Clock}
          title="Pending Approval"
          value={stats.pendingCount}
          borderColor="border-l-amber-400"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
        
        <StatsCard
          icon={CheckCircle}
          title="Approved"
          value={stats.approvedCount}
          borderColor="border-l-green-400"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        
        <StatsCard
          icon={MapPin}
          title="In-Valley"
          value={stats.inValleyCount}
          borderColor="border-l-purple-400"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        
        <StatsCard
          icon={DollarSign}
          title="Approved Amount"
          value={stats.totalAmount}
          valuePrefix="Nrs."
          borderColor="border-l-blue-400"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/tasks')}
              className="flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Tasks
            </Button>
          </div>
          
          {/* Main Dashboard Card */}
          <Card>
        <DashboardHeader
          title="Approver Dashboard"
          description="Review and approve expense requests assigned to you"
          icon={Briefcase}
          role="approver"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => setStatusFilter(value as any)}
          typeFilter={typeFilter}
          onTypeFilterChange={(value) => setTypeFilter(value as any)}
          onRefresh={handleRefresh}
          loading={loading}
        />
        
        <CardContent>
          <RequestTabs
            tabs={tabs}
            defaultTab="pending"
            onTabChange={setActiveTab}
          >
            <TabsContent value="pending">
              <RequestTable
                requests={filteredRequests}
                loading={loading}
                onViewDetails={handleViewDetails}
                sortConfig={sortConfig}
                onSort={handleSort}
                emptyStateProps={{
                  icon: Clock,
                  title: "No pending requests",
                  description: "You have no requests awaiting your approval at this time"
                }}
                variant="approver"
                mode="pending"
                actionVariant="review"
                rowClassName={(request) => {
                  return request.status === 'pending' ? 'border-l-2 border-l-amber-400' : '';
                }}
              />
              
              <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                <div>
                  Total: {activeTab === 'pending' ? pendingRequests.length : completedRequests.length} request(s)
                </div>
                <div>
                  Showing {filteredRequests.length} of {activeTab === 'pending' ? pendingRequests.length : completedRequests.length} requests
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="completed">
              <RequestTable
                requests={filteredRequests}
                loading={loading}
                onViewDetails={handleViewDetails}
                sortConfig={sortConfig}
                onSort={handleSort}
                emptyStateProps={{
                  icon: FileText,
                  title: "No processed requests",
                  description: "You haven't processed any requests yet"
                }}
                variant="approver"
                mode="completed"
                actionVariant="view"
                showSubmittedDate={true}
              />
              
              <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                <div>
                  Total: {activeTab === 'pending' ? pendingRequests.length : completedRequests.length} request(s)
                </div>
                <div>
                  Showing {filteredRequests.length} of {activeTab === 'pending' ? pendingRequests.length : completedRequests.length} requests
                </div>
              </div>
            </TabsContent>
          </RequestTabs>
        </CardContent>
          </Card>
          
      
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <AttendancePanel userId={session?.user?.id || ''} userName={session?.user?.name || 'Approver'} />
          
          {/* Attendance Sheet Button */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <Button 
                onClick={() => router.push('/attendance-sheet')}
                className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Users className="h-4 w-4" />
                View Attendance Sheet
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                View complete monthly attendance records for all employees
              </p>
            </CardContent>
          </Card>
          
          <LeaveRequestsPanel approverId={session?.user?.id || ''} />
        </div>
      </div>
    </div>
  );
}