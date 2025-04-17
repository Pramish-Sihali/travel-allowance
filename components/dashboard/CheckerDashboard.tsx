'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Search, Filter, Briefcase, ArrowUpDown, Clock, DollarSign, RefreshCw, ArrowRight, FileText, CreditCard, AlertTriangle, CheckCircle, CheckSquare, Settings, MapPin, Plane } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
  
  // New state for projects and budgets
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to force re-fetching
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
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply filters and sorting
  const getFilteredRequests = () => {
    const activeRequests = activeTab === 'pending' ? pendingRequests : completedRequests;
    
    // Apply search filter
    let filteredRequests = [...activeRequests];
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(req => 
        req.employeeName?.toLowerCase()?.includes(lowerCaseSearch) ||
        req.department?.toLowerCase()?.includes(lowerCaseSearch) ||
        req.purpose?.toLowerCase()?.includes(lowerCaseSearch)
      );
    }
    
    // Apply request type filter
    if (requestTypeFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.requestType === requestTypeFilter);
    }
    
    // Apply additional filtering if on completed tab
    if (activeTab === 'completed' && filter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === filter);
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      filteredRequests.sort((a, b) => {
        const getValueByKey = (obj: any, key: string) => {
          if (key === 'travelDateFrom' || key === 'travelDateTo' || key === 'createdAt' || key === 'updatedAt') {
            return new Date(obj[key] || 0).getTime();
          }
          return obj[key] || '';
        };

        const aValue = getValueByKey(a, sortConfig.key);
        const bValue = getValueByKey(b, sortConfig.key);
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredRequests;
  };
  
  const handleViewDetails = (request: TravelRequest) => {
    if (request.requestType === 'in-valley') {
      router.push(`/checker/request-detail/in-valley/${request.id}`);
    } else {
      router.push(`/checker/request-detail/${request.id}`);
    }
  };
  
  const getSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown size={14} className="ml-1 text-primary rotate-0" />;
    }
    
    return <ArrowUpDown size={14} className="ml-1 text-primary rotate-180" />;
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected_by_checker':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getFormattedStatus = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected_by_checker':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'in-valley':
        return 'In-Valley';
      case 'normal':
        return 'Travel';
      case 'advance':
        return 'Advance';
      case 'emergency':
        return 'Emergency';
      default:
        return 'Travel';
    }
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
  
  // Get a project's budget
  const getProjectBudget = (projectId: string) => {
    const projectBudget = budgets.find(budget => budget.project_id === projectId);
    return projectBudget?.amount || 0;
  };
  
  const renderSkeletonTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]"><Skeleton className="h-4 w-3/4" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
            <TableHead><Skeleton className="h-4 w-1/2" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-10 w-3/4" /></TableCell>
              <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
              <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
              <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
              <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
              <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-9 w-24" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  const filteredRequests = getFilteredRequests();
  
  // Counts for the different request types
  const travelCount = allRequests.filter(req => req.requestType === 'normal' || !req.requestType).length;
  const inValleyCount = allRequests.filter(req => req.requestType === 'in-valley').length;
  const advanceCount = allRequests.filter(req => req.requestType === 'advance').length;
  const emergencyCount = allRequests.filter(req => req.requestType === 'emergency').length;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center">
              <CheckSquare className="mr-2 text-primary h-5 w-5" />
              <CardTitle>Financial Verification Dashboard</CardTitle>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 max-w-[300px]"
                />
              </div>
              
              <Button 
                variant="outline"
                onClick={handleRefresh} 
                disabled={loading || refreshing}
                size="icon"
              >
                <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Verify and manage reimbursement requests
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pending Verification</span>
                <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Completed Requests</span>
                <Badge variant="secondary" className="ml-1">{completedRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Project Budgets</span>
              </TabsTrigger>
            </TabsList>
            
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
            
              {loading ? (
                renderSkeletonTable()
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No pending verification requests</p>
                  <p className="text-sm text-muted-foreground mb-6">All requests have been processed or check back later for new requests</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('employeeName')}
                        >
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-muted-foreground" />
                            Employee
                            {getSortIndicator('employeeName')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('requestType')}
                        >
                          <div className="flex items-center">
                            <FileText size={16} className="mr-2 text-muted-foreground" />
                            Type
                            {getSortIndicator('requestType')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('department')}
                        >
                          <div className="flex items-center">
                            Department
                            {getSortIndicator('department')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('travelDateFrom')}
                        >
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-muted-foreground" />
                            Date
                            {getSortIndicator('travelDateFrom')}
                          </div>
                        </TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('totalAmount')}
                        >
                          <div className="flex items-center">
                            <DollarSign size={16} className="mr-2 text-muted-foreground" />
                            Amount
                            {getSortIndicator('totalAmount')}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                  {getInitials(request.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{request.employeeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "flex items-center gap-1.5 w-fit",
                              request.requestType === 'normal' || !request.requestType ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              request.requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                              request.requestType === 'in-valley' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            )}>
                              {(request.requestType === 'normal' || !request.requestType) && <Plane className="h-3 w-3" />}
                              {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                              {request.requestType === 'in-valley' && <MapPin className="h-3 w-3" />}
                              {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                              {getRequestTypeLabel(request.requestType || 'normal')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{request.department}</TableCell>
                          <TableCell>
                            {request.requestType === 'in-valley' ? (
                              <div className="text-sm">
                                <span className="font-medium">
                                  {new Date(request.expenseDate || request.travelDateFrom).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span>
                                  {new Date(request.travelDateFrom).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  to {new Date(request.travelDateTo).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="max-w-[200px] truncate">
                                    {request.purpose}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{request.purpose}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="font-medium">
                            Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                              className="opacity-80 group-hover:opacity-100"
                            >
                              Verify
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
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
            
              {loading ? (
                renderSkeletonTable()
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No completed requests found</p>
                  <p className="text-sm text-muted-foreground mb-6">Adjust your filters or check back later</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('employeeName')}
                        >
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-muted-foreground" />
                            Employee
                            {getSortIndicator('employeeName')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('requestType')}
                        >
                          <div className="flex items-center">
                            <FileText size={16} className="mr-2 text-muted-foreground" />
                            Type
                            {getSortIndicator('requestType')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('createdAt')}
                        >
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-muted-foreground" />
                            Date
                            {getSortIndicator('createdAt')}
                          </div>
                        </TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('totalAmount')}
                        >
                          <div className="flex items-center">
                            <DollarSign size={16} className="mr-2 text-muted-foreground" />
                            Amount
                            {getSortIndicator('totalAmount')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('status')}
                        >
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-muted-foreground" />
                            Status
                            {getSortIndicator('status')}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                  {getInitials(request.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{request.employeeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "flex items-center gap-1.5 w-fit",
                              request.requestType === 'normal' || !request.requestType ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              request.requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                              request.requestType === 'in-valley' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            )}>
                              {(request.requestType === 'normal' || !request.requestType) && <Plane className="h-3 w-3" />}
                              {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                              {request.requestType === 'in-valley' && <MapPin className="h-3 w-3" />}
                              {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                              {getRequestTypeLabel(request.requestType || 'normal')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="max-w-[200px] truncate">
                                    {request.purpose}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{request.purpose}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="font-medium">
                            Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(request.status)}>
                              {getFormattedStatus(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(request)}
                              className="opacity-80 group-hover:opacity-100"
                            >
                              View
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredRequests.length} of {completedRequests.length} completed requests
              </div>
            </TabsContent>
            
            {/* Project Budgets Tab */}
            <TabsContent value="projects" className="space-y-6">
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
                <div className="text-center py-12 border rounded-lg">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No projects found</p>
                  <p className="text-sm text-muted-foreground mb-6">Add projects in the settings to manage budgets</p>
                  <Button
                    onClick={() => router.push('/admin/settings')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Go to Settings
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Briefcase className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Projects</p>
                            <p className="text-xl font-bold">{projects.length}</p>
                            <p className="text-xs text-muted-foreground">
                              {projects.filter(p => p.active).length} active projects
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-full">
                            <DollarSign className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Budget</p>
                            <p className="text-xl font-bold">
                              Nrs.{calculateTotalBudget().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Across all projects
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-purple-500 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-purple-100 p-3 rounded-full">
                            <CheckCircle className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Approved Expenses</p>
                            <p className="text-xl font-bold">
                              Nrs.{calculateApprovedAmount().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {completedRequests.filter(req => req.status === 'approved').length} approved requests
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100">
                <Clock size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending</p>
                <p className="text-xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Plane size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Travel</p>
                <p className="text-xl font-bold">{travelCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">In-Valley</p>
                <p className="text-xl font-bold">{inValleyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Approved</p>
                <p className="text-xl font-bold">
                  {completedRequests.filter(req => req.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}