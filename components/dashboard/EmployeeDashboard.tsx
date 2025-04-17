'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from 'uuid';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import our reusable components
import {
  StatsCard,
  RequestTabs,
  RequestTable,
  FilterControls,
  EmptyState,
  filterRequests,
  sortRequests,
  toggleSort,
  splitRequestsByDate,
  getRequestStatistics,
  formatDate
} from '@/components/dashboard';

// Import icons
import { 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Mail, 
  HelpCircle, 
  ArrowRight,
  ChevronRight,
  Plane,
  MapPin
} from 'lucide-react';
import { TabsContent } from '@radix-ui/react-tabs';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // Get employeeId from session, or generate one if not available
  const employeeId = session?.user?.id || uuidv4();
  
  // Fetch both regular travel requests and in-valley requests
  const fetchAllRequests = async () => {
    if (status === 'loading') return;
    
    try {
      setLoading(true);
      
      // Fetch travel requests
      const travelResponse = await fetch(`/api/requests?employeeId=${employeeId}`);
      if (!travelResponse.ok) {
        throw new Error('Failed to fetch travel requests');
      }
      const travelData = await travelResponse.json();
      
      // Fetch in-valley requests
      const valleyResponse = await fetch(`/api/valley-requests?employeeId=${employeeId}`);
      let valleyData: any[] = [];
      
      if (valleyResponse.ok) {
        valleyData = await valleyResponse.json();
      } else {
        console.warn('Failed to fetch in-valley requests, might not be implemented yet');
      }
      
      // Combine both types of requests
      const allRequests = [...travelData, ...valleyData];
      console.log('Fetched all employee requests:', allRequests);
      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllRequests();
  }, [employeeId, status]);
  
  const handleRefresh = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('all');
    fetchAllRequests();
  };
  
  const handleSort = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };
  
  const handleRequestClick = (request: TravelRequest) => {
    if (request.requestType === 'in-valley') {
      router.push(`/employee/requests/in-valley/${request.id}`);
    } else {
      router.push(`/employee/requests/${request.id}`);
    }
  };
  
  // Get filtered and sorted requests
  const getFilteredRequests = () => {
    // Apply filters
    const filteredRequests = filterRequests(
      requests,
      searchTerm,
      filterStatus,
      filterType
    );
    
    // Split into current and past requests
    const { currentRequests, pastRequests } = splitRequestsByDate(filteredRequests);
    
    // Get the active set of requests
    const activeRequests = activeTab === 'current' ? currentRequests : pastRequests;
    
    // Apply sorting
    return sortRequests(activeRequests, sortConfig);
  };

  const filteredRequests = getFilteredRequests();
  
  // Get statistics
  const stats = getRequestStatistics(requests);
  
  // Configure tabs
  const tabs = [
    {
      id: 'current',
      label: 'Current Requests',
      icon: Clock
    },
    {
      id: 'past',
      label: 'Past Requests',
      icon: Calendar
    }
  ];
  
  // Status options for filters
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];
  
  // Request type options for filters
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'normal', label: 'Travel' },
    { value: 'in-valley', label: 'In-Valley' },
    { value: 'advance', label: 'Advance' },
    { value: 'emergency', label: 'Emergency' }
  ];
  
  if (loading && status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header variant="employee" />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full mx-auto mb-4 bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 mx-auto bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="employee" />
      
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">My Expense Requests</h1>
                
                {/* New Request Dropdown Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <PlusCircle size={16} />
                      New Request
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/employee/requests/new')}>
                      <Plane className="h-4 w-4 mr-2" />
                      Travel Request
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/employee/requests/in-valley')}>
                      <MapPin className="h-4 w-4 mr-2" />
                      In-Valley Reimbursement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  icon={Clock}
                  title="Pending"
                  value={stats.pendingCount}
                  borderColor="border-l-amber-400"
                  iconColor="text-amber-600"
                  iconBgColor="bg-amber-100"
                />
                
                <StatsCard
                  icon={FileText}
                  title="Approved"
                  value={stats.approvedCount}
                  borderColor="border-l-green-400"
                  iconColor="text-green-600"
                  iconBgColor="bg-green-100"
                />
                
                <StatsCard
                  icon={Plane}
                  title="Travel"
                  value={stats.travelCount}
                  borderColor="border-l-purple-400"
                  iconColor="text-purple-600"
                  iconBgColor="bg-purple-100"
                />
                
                <StatsCard
                  icon={DollarSign}
                  title="Total Amount"
                  value={stats.totalAmount}
                  valuePrefix="Nrs."
                  borderColor="border-l-blue-400"
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-100"
                />
              </div>
              
              {requests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="mb-4">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-4">You haven't submitted any expense requests yet.</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="lg" className="flex items-center gap-2">
                          <PlusCircle size={16} />
                          Create Your First Request
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push('/employee/requests/new')}>
                          <Plane className="h-4 w-4 mr-2" />
                          Travel Request
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/employee/requests/in-valley')}>
                          <MapPin className="h-4 w-4 mr-2" />
                          In-Valley Reimbursement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                      <CardTitle className="text-lg">All Expense Requests</CardTitle>
                      
                      <FilterControls
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        statusFilter={filterStatus}
                        onStatusFilterChange={setFilterStatus}
                        typeFilter={filterType}
                        onTypeFilterChange={setFilterType}
                        onRefresh={handleRefresh}
                        statusOptions={statusOptions}
                        searchPlaceholder="Search my requests..."
                      />
                    </div>
                    <CardDescription>
                      View and manage all your submitted expense requests
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <RequestTabs
                      tabs={tabs}
                      defaultTab="current"
                      onTabChange={setActiveTab}
                    >
                      <TabsContent value="current">
                        <RequestTable
                          requests={filteredRequests}
                          loading={loading}
                          onViewDetails={handleRequestClick}
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          emptyStateProps={{
                            icon: FileText,
                            title: "No current requests found",
                            description: "You don't have any current requests"
                          }}
                          variant="employee"
                          mode="current"
                          actionVariant="view"
                          showDepartment={false}
                          actionLabel="View"
                          onRowClick={handleRequestClick}
                        />
                      </TabsContent>
                      
                      <TabsContent value="past">
                        <RequestTable
                          requests={filteredRequests}
                          loading={loading}
                          onViewDetails={handleRequestClick}
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          emptyStateProps={{
                            icon: Calendar,
                            title: "No past requests found",
                            description: "You don't have any past requests"
                          }}
                          variant="employee"
                          mode="past"
                          actionVariant="view"
                          showDepartment={false}
                          showSubmittedDate={true}
                          actionLabel="View"
                          onRowClick={handleRequestClick}
                        />
                      </TabsContent>
                    </RequestTabs>
                  </CardContent>
                </Card>
              )}
              
              {/* Travel Policy Highlights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen size={18} className="text-primary" />
                    Travel Policy Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Submit all invoices and supporting documents within three days of returning from the field.</p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Local travel and food allowances are covered through per-diem (NPR 1,500), and no invoices are needed for these expenses.</p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">3</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Accommodation and other costs will be reimbursed based on actual expenses, with invoices in the company's name required.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">4</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Maximum lodging allowance for each official trip will be determined by the Board and Finance Department based on the nature of travel.</p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">5</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Any additional expenses for which reimbursement is requested must be supported by invoices or bills.</p>
                      </div>
                      
                      <Button variant="link" className="text-sm text-primary mt-2 pl-7">
                        View Full Policy Document
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="md:col-span-1 space-y-6">
              <NotificationsPanel userId={employeeId} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink size={18} />
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <Button 
                      variant="ghost" 
                      className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                    >
                      <BookOpen size={18} className="text-primary" />
                      <span>Travel Policy Documents</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                    >
                      <FileText size={18} className="text-primary" />
                      <span>Expense Categories Guide</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                    >
                      <Mail size={18} className="text-primary" />
                      <span>Contact Finance Department</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
                    >
                      <HelpCircle size={18} className="text-primary" />
                      <span>Frequently Asked Questions</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    If you have any questions about your expense reimbursements or need assistance with your requests, contact the finance team.
                  </p>
                  <Button variant="link" asChild className="p-0 h-auto text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <a href="mailto:finance@company.com">
                      <Mail size={14} />
                      finance@company.com
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}