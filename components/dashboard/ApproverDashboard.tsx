'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TravelRequest } from '@/types';
import { Card, CardContent } from "@/components/ui/card";

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
  AlertTriangle
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
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch requests assigned to this approver
      const response = await fetch('/api/approver-requests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch approver requests');
      }
      
      const data = await response.json();
      console.log('Fetched approver requests:', data);
      setRequests(data);
      
      // Split requests by status
      const pending = data.filter((req: TravelRequest) => 
        req.status === 'pending' || req.status === 'travel_approved'
      );
      
      const completed = data.filter((req: TravelRequest) => 
        req.status === 'approved' || 
        req.status === 'rejected' || 
        req.status === 'pending_verification' ||
        req.status === 'rejected_by_checker'
      );
      
      setPendingRequests(pending);
      setCompletedRequests(completed);
      
      // Calculate statistics
      calculateStats(data);
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
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      
      {/* Help Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approval Process
            </h3>
            <div className="space-y-4 mt-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-amber-700">1</span>
                </div>
                <div>
                  <p className="font-medium">Review Request Details</p>
                  <p className="text-sm text-muted-foreground">Verify that the travel purpose aligns with business needs and company policy</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-amber-700">2</span>
                </div>
                <div>
                  <p className="font-medium">Approve or Reject</p>
                  <p className="text-sm text-muted-foreground">Make a decision based on your review and provide any necessary comments</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-amber-700">3</span>
                </div>
                <div>
                  <p className="font-medium">Financial Verification</p>
                  <p className="text-sm text-muted-foreground">After your approval, the request will be sent to Finance for final verification</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Approval Guidelines
            </h3>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted/10 rounded-md">
                <p className="font-medium">Expense Policy Compliance</p>
                <p className="text-sm text-muted-foreground">Ensure that all expenses comply with company policy limits and guidelines</p>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-md">
                <p className="font-medium">Business Justification</p>
                <p className="text-sm text-muted-foreground">Verify that each request has a clear business purpose and justification</p>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-md">
                <p className="font-medium">Budget Considerations</p>
                <p className="text-sm text-muted-foreground">Check that expenses are within departmental or project budget constraints</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}