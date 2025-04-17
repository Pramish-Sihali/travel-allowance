'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { Card, CardContent } from "@/components/ui/card";

// Import our reusable components
import {
  StatsCard,
  DashboardHeader,
  RequestTabs,
  RequestTable,
  EmptyState,
  filterRequests,
  sortRequests,
  toggleSort,
  splitRequestsByStatus,
  getRequestDetailRoute,
  getRequestStatistics
} from '@/components/dashboard';

// Import icons
import {
  Briefcase,
  Clock,
  FileText,
  DollarSign,
  MapPin
} from 'lucide-react';
import { TabsContent } from '@radix-ui/react-tabs';

export default function ApproverDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'normal' | 'in-valley' | 'advance' | 'emergency'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch travel requests
      const travelResponse = await fetch('/api/requests');
      if (!travelResponse.ok) {
        throw new Error('Failed to fetch travel requests');
      }
      const travelData = await travelResponse.json();
      
      // Fetch in-valley requests
      const valleyResponse = await fetch('/api/valley-requests');
      let valleyData: any[] = [];
      
      if (valleyResponse.ok) {
        valleyData = await valleyResponse.json();
      } else {
        console.warn('Failed to fetch in-valley requests, might not be implemented yet');
      }
      
      // Combine both types of requests
      const allRequests = [...travelData, ...valleyData];
      console.log('Fetched approver requests:', allRequests);
      setRequests(allRequests);
      
      // Split requests by status
      const { pendingRequests, completedRequests } = splitRequestsByStatus(allRequests);
      setPendingRequests(pendingRequests);
      setCompletedRequests(completedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
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
  
  // Get statistics
  const stats = getRequestStatistics(requests);
  
  // Define the tabs
  const tabs = [
    {
      id: 'pending',
      label: 'Pending Requests',
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
    <div className="max-w-9xl mx-auto">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          icon={Clock}
          title="Pending Approval"
          value={pendingRequests.length}
          borderColor="border-l-green-400"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        
        <StatsCard
          icon={FileText}
          title="Approved"
          value={completedRequests.filter(req => req.status === 'approved' || req.status === 'pending_verification').length}
          borderColor="border-l-blue-400"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
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
          title="Total Amount"
          value={stats.approvedAmount}
          valuePrefix="Nrs."
          borderColor="border-l-amber-400"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
      </div>
      
      {/* Main Dashboard Card */}
      <Card>
        <DashboardHeader
          title="Expense Requests Dashboard"
          description="Manage and review employee expense reimbursement requests"
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
                  icon: Briefcase,
                  title: "No pending requests found",
                  description: "All requests have been processed or check back later for new requests"
                }}
                variant="approver"
                mode="pending"
                actionVariant="review"
              />
              
              <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                <div>
                  Total requests: {requests.length}
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
                  title: "No processed requests found",
                  description: "Adjust your filters or check back later"
                }}
                variant="approver"
                mode="completed"
                actionVariant="view"
              />
              
              <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                <div>
                  Total requests: {requests.length}
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
  );
}