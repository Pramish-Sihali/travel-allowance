'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  getRequestDetailRoute,
  getRequestStatistics,
  UserAvatar,
  TableSkeleton
} from '@/components/dashboard';

// Import icons
import {
  CheckSquare,
  Clock, 
  CheckCircle, 
  Briefcase,
  Settings,
  DollarSign,
  Plane,
  MapPin,
  Filter,
  FileText
} from 'lucide-react';
import { TabsContent } from '@radix-ui/react-tabs';

// Interface definitions for projects and budgets
interface Project {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface Budget {
  id: string;
  project_id: string;
  amount: number;
  fiscal_year: number;
  description: string;
}

export default function CheckerDashboard() {
  const router = useRouter();
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);
  const [valleyRequests, setValleyRequests] = useState<TravelRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TravelRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'approved' | 'rejected_by_checker'>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<'all' | 'normal' | 'in-valley' | 'advance' | 'emergency'>('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // State for projects and budgets
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch both travel requests and in-valley requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching all requests...");
      
      // Fetch travel requests
      const travelResponse = await fetch('/api/requests');
      if (!travelResponse.ok) {
        throw new Error('Failed to fetch travel requests');
      }
      const travelData = await travelResponse.json();
      setTravelRequests(travelData);
      
      // Fetch in-valley requests
      const valleyResponse = await fetch('/api/valley-requests');
      let valleyData: any[] = [];
      
      if (valleyResponse.ok) {
        valleyData = await valleyResponse.json();
        setValleyRequests(valleyData);
      } else {
        console.warn('Failed to fetch in-valley requests, might not be implemented yet');
      }
      
      // Combine both types of requests
      const allRequestsData = [...travelData, ...valleyData];
      
      // Filter out requests by status
      const pendingVerificationRequests = allRequestsData.filter(
        (req: TravelRequest) => req.status === 'pending_verification'
      );
      
      const verifiedRequests = allRequestsData.filter(
        (req: TravelRequest) => req.status === 'approved' || req.status === 'rejected_by_checker'
      );
      
      setAllRequests(allRequestsData);
      setPendingRequests(pendingVerificationRequests);
      setCompletedRequests(verifiedRequests);
      
      console.log(`Fetched ${allRequestsData.length} requests (${pendingVerificationRequests.length} pending, ${verifiedRequests.length} completed)`);
      console.log(`Travel requests: ${travelData.length}, In-valley requests: ${valleyData.length}`);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      console.log("Fetching projects...");
      
      // Fetch projects
      const projectsResponse = await fetch('/api/projects?includeInactive=true', {
        cache: 'no-store',
      });
      
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await projectsResponse.json();
      console.log(`Fetched ${projectsData.length} projects`);
      setProjects(projectsData);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, []);
  
  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    try {
      console.log("Fetching budgets from the public API...");
      
      // Use the public API endpoint (not the admin one)
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const budgetsResponse = await fetch(`/api/budgets?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!budgetsResponse.ok) {
        console.error('Budget fetch error status:', budgetsResponse.status);
        const errorText = await budgetsResponse.text();
        console.error('Budget fetch error response:', errorText);
        throw new Error(`Failed to fetch budgets: ${budgetsResponse.status} ${errorText}`);
      }
      
      const budgetsData = await budgetsResponse.json();
      console.log(`Fetched ${budgetsData.length} budgets:`, budgetsData);
      setBudgets(budgetsData);
      
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  }, []);
  
  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchRequests(), fetchProjects(), fetchBudgets()]);
    };
    
    loadInitialData();
  }, [fetchRequests, fetchProjects, fetchBudgets, refreshKey]);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log("Manually refreshing all data...");
      await Promise.all([fetchRequests(), fetchProjects(), fetchBudgets()]);
      console.log("Data refresh complete");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleSort = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };
  
  // Apply filters and sorting
  const getFilteredRequests = () => {
    const activeRequests = activeTab === 'pending' ? pendingRequests : completedRequests;
    
    // Apply filters
    let filteredRequests = filterRequests(
      activeRequests,
      searchTerm,
      activeTab === 'completed' ? filter : 'all',
      requestTypeFilter
    );
    
    // Apply sorting
    return sortRequests(filteredRequests, sortConfig);
  };
  
  const handleViewDetails = (request: TravelRequest) => {
    const route = getRequestDetailRoute('checker', request.requestType, request.id);
    router.push(route);
  };
  
  // Calculate total budget across all projects
  const calculateTotalBudget = () => {
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  };
  
  // Calculate total approved amount
  const calculateApprovedAmount = () => {
    return completedRequests
      .filter(req => req.status === 'approved')
      .reduce((total, req) => total + (req.totalAmount || 0), 0);
  };
  
  const filteredRequests = getFilteredRequests();
  
  // Get statistics
  const stats = getRequestStatistics(allRequests);
  
  // Define the tabs
  const tabs = [
    {
      id: 'pending',
      label: 'Pending Verification',
      icon: Clock,
      count: pendingRequests.length,
      hideTextOnMobile: true
    },
    {
      id: 'completed',
      label: 'Completed Requests',
      icon: CheckCircle,
      count: completedRequests.length,
      hideTextOnMobile: true
    },
    {
      id: 'projects',
      label: 'Project Budgets',
      icon: Briefcase,
      hideTextOnMobile: true
    }
  ];

  // Render the projects tab content
  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Project Budgets
        </h3>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/settings')}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Settings
        </Button>
      </div>
      
      {projectsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects found"
          description="Add projects in the settings to manage budgets"
          actionLabel="Go to Settings"
          onAction={() => router.push('/admin/settings')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              icon={Briefcase}
              title="Total Projects"
              value={projects.length}
              subtitle={`${projects.filter(p => p.active).length} active projects`}
              borderColor="border-l-blue-500"
              iconColor="text-blue-500"
              iconBgColor="bg-blue-100"
            />
            
            <StatsCard
              icon={DollarSign}
              title="Total Budget"
              value={calculateTotalBudget()}
              valuePrefix="Nrs."
              subtitle="Across all projects"
              borderColor="border-l-green-500"
              iconColor="text-green-500"
              iconBgColor="bg-green-100"
            />
            
            <StatsCard
              icon={CheckCircle}
              title="Approved Expenses"
              value={calculateApprovedAmount()}
              valuePrefix="Nrs."
              subtitle={`${completedRequests.filter(req => req.status === 'approved').length} approved requests`}
              borderColor="border-l-purple-500"
              iconColor="text-purple-500"
              iconBgColor="bg-purple-100"
            />
          </div>
        
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Project Name</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Current Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  // Find budget for this project
                  const projectBudget = budgets.find(b => b.project_id === project.id);
                  const budgetAmount = projectBudget ? projectBudget.amount : 0;
                  
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={project.active ? 
                          'bg-green-100 text-green-800 border-green-200' : 
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                          {project.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[300px] truncate">
                                {project.description || 'No description'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{project.description || 'No description'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        Nrs.{budgetAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <p>
              Showing {projects.length} projects
            </p>
            <p>
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <DashboardHeader
          title="Financial Verification Dashboard"
          description="Verify and manage reimbursement requests"
          icon={CheckSquare}
          role="checker"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={filter}
          onStatusFilterChange={(value) => setFilter(value as any)}
          typeFilter={requestTypeFilter}
          onTypeFilterChange={(value) => setRequestTypeFilter(value as any)}
          onRefresh={handleRefresh}
          loading={loading || refreshing}
        />
        
        <CardContent>
          <RequestTabs
            tabs={tabs}
            defaultTab="pending"
            onTabChange={setActiveTab}
          >
            <TabsContent value="pending" className="space-y-4">
              <div className="flex justify-end gap-3 mb-4">
                <Select
                  value={requestTypeFilter}
                  onValueChange={(value) => setRequestTypeFilter(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Request Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Request Types</SelectItem>
                    <SelectItem value="normal">Travel Requests</SelectItem>
                    <SelectItem value="in-valley">In-Valley Requests</SelectItem>
                    <SelectItem value="advance">Advance Requests</SelectItem>
                    <SelectItem value="emergency">Emergency Requests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <RequestTable
                requests={filteredRequests}
                loading={loading}
                onViewDetails={handleViewDetails}
                sortConfig={sortConfig}
                onSort={handleSort}
                emptyStateProps={{
                  icon: Clock,
                  title: "No pending verification requests",
                  description: "All requests have been processed or check back later for new requests"
                }}
                variant="checker"
                mode="pending"
                actionVariant="verify"
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                {pendingRequests.length} requests pending verification
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              <div className="flex justify-end gap-3 mb-4">
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verified</SelectItem>
                    <SelectItem value="approved">Approved Requests</SelectItem>
                    <SelectItem value="rejected_by_checker">Rejected Requests</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={requestTypeFilter}
                  onValueChange={(value) => setRequestTypeFilter(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Request Types</SelectItem>
                    <SelectItem value="normal">Travel Requests</SelectItem>
                    <SelectItem value="in-valley">In-Valley Requests</SelectItem>
                    <SelectItem value="advance">Advance Requests</SelectItem>
                    <SelectItem value="emergency">Emergency Requests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <RequestTable
                requests={filteredRequests}
                loading={loading}
                onViewDetails={handleViewDetails}
                sortConfig={sortConfig}
                onSort={handleSort}
                emptyStateProps={{
                  icon: FileText,
                  title: "No completed requests found",
                  description: "Adjust your filters or check back later"
                }}
                variant="checker"
                mode="completed"
                actionVariant="view"
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredRequests.length} of {completedRequests.length} completed requests
              </div>
            </TabsContent>
            
            {/* Project Budgets Tab */}
            <TabsContent value="projects">
              {renderProjectsTab()}
            </TabsContent>
          </RequestTabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <StatsCard
          icon={Clock}
          title="Pending"
          value={pendingRequests.length}
          borderColor="border-l-purple-400"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        
        <StatsCard
          icon={Plane}
          title="Travel"
          value={stats.travelCount}
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
          icon={CheckCircle}
          title="Approved"
          value={completedRequests.filter(req => req.status === 'approved').length}
          borderColor="border-l-green-400"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
      </div>
    </div>
  );
}