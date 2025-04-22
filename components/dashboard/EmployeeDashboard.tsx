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
  MapPin,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';
import { TabsContent } from '@radix-ui/react-tabs';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
    travelCount: 0,
    inValleyCount: 0,
    waitingForExpenses: 0
  });
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
      
      // Calculate statistics
      const pendingCount = allRequests.filter((req: TravelRequest) => req.status === 'pending').length;
      const approvedCount = allRequests.filter((req: TravelRequest) => req.status === 'approved').length;
      const rejectedCount = allRequests.filter((req: TravelRequest) => req.status === 'rejected' || req.status === 'rejected_by_checker').length;
      const waitingForExpensesCount = allRequests.filter((req: TravelRequest) => req.status === 'travel_approved').length;
      const totalAmount = allRequests.reduce((sum: number, req: TravelRequest) => sum + req.totalAmount, 0);
      const travelCount = travelData.length;
      const inValleyCount = valleyData.length;
      
      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAmount: totalAmount,
        travelCount: travelCount,
        inValleyCount: inValleyCount,
        waitingForExpenses: waitingForExpensesCount
      });
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
  
  // Get CSS classes for status badges
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'travel_approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_verification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'rejected_by_checker':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getFormattedStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'travel_approved':
        return 'Ready for Expenses';
      case 'pending_verification':
        return 'Under Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      case 'approved':
        return 'Approved';
      case 'rejected':
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
  
  const handleRequestClick = (request: TravelRequest) => {
    // For travel_approved requests, route to the expense submission form
    if (request.status === 'travel_approved') {
      if (request.requestType === 'in-valley') {
        router.push(`/employee/requests/in-valley?id=${request.id}&expenses=true`);
      } else {
        router.push(`/employee/requests/new?id=${request.id}&expenses=true`);
      }
    } else {
      // For other requests, route to the detail view
      if (request.requestType === 'in-valley') {
        router.push(`/employee/requests/in-valley/${request.id}`);
      } else {
        router.push(`/employee/requests/${request.id}`);
      }
    }
  };
  
  // Apply all filters to requests
  const filteredRequests = requests
    .filter(request => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.purpose.toLowerCase().includes(searchLower) ||
          new Date(request.travelDateFrom).toLocaleDateString().includes(searchLower) ||
          new Date(request.travelDateTo).toLocaleDateString().includes(searchLower) ||
          request.status.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(request => {
      // Filter by status
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return request.status === 'pending';
      if (filterStatus === 'approved') return request.status === 'approved';
      if (filterStatus === 'rejected') return request.status === 'rejected' || request.status === 'rejected_by_checker';
      if (filterStatus === 'awaiting_expenses') return request.status === 'travel_approved';
      if (filterStatus === 'under_verification') return request.status === 'pending_verification';
      return true;
    })
    .filter(request => {
      // Filter by request type
      if (filterType === 'all') return true;
      return request.requestType === filterType;
    });
  
  // Group requests
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const awaitingExpensesRequests = filteredRequests.filter(req => req.status === 'travel_approved');
  const pendingVerificationRequests = filteredRequests.filter(req => req.status === 'pending_verification');
  const completedRequests = filteredRequests.filter(
    req => ['approved', 'rejected', 'rejected_by_checker'].includes(req.status)
  );
  
  const currentRequests = [...pendingRequests, ...awaitingExpensesRequests, ...pendingVerificationRequests];
  const pastRequests = [...completedRequests];
  
  const activeRequests = activeTab === 'current' ? currentRequests : pastRequests;
  
  // Status options for filters
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'awaiting_expenses', label: 'Ready for Expenses' },
    { value: 'under_verification', label: 'Under Verification' },
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
  
  if (loading && status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
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
                <Card className="border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-amber-100">
                        <Clock size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Pending</p>
                        <p className="text-xl font-bold">{stats.pending}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-blue-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-blue-100">
                        <DollarSign size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Need Expenses</p>
                        <p className="text-xl font-bold">{stats.waitingForExpenses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-green-100">
                        <FileText size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Approved</p>
                        <p className="text-xl font-bold">{stats.approved}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-purple-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-purple-100">
                        <Plane size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Amount</p>
                        <p className="text-xl font-bold">
                          Nrs.{stats.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                      
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-full sm:w-[200px]"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <select
                            className="w-[130px] border rounded-md p-2 text-sm bg-background"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          
                          <select
                            className="w-[130px] border rounded-md p-2 text-sm bg-background"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                          >
                            {typeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          
                          <Button 
                            variant="outline"
                            onClick={handleRefresh} 
                            size="icon"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardDescription>
                      View and manage all your submitted expense requests
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs defaultValue="current" onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="current" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Current Requests</span>
                        </TabsTrigger>
                        <TabsTrigger value="past" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Completed Requests</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="current">
                        {currentRequests.length === 0 ? (
                          <div className="text-center py-10 bg-muted/20 rounded-md">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No current requests found</p>
                          </div>
                        ) : (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <FileText size={16} className="mr-2 text-muted-foreground" />
                                      Purpose
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <Calendar size={16} className="mr-2 text-muted-foreground" />
                                      Date
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <FileText size={16} className="mr-2 text-muted-foreground" />
                                      Type
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <DollarSign size={16} className="mr-2 text-muted-foreground" />
                                      Amount
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <Clock size={16} className="mr-2 text-muted-foreground" />
                                      Status
                                    </div>
                                  </TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentRequests.map((request) => (
                                  <TableRow 
                                    key={request.id} 
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRequestClick(request)}
                                  >
                                    <TableCell>
                                      <div className="max-w-[200px] truncate font-medium" title={request.purpose}>
                                        {request.purpose.substring(0, 30)}
                                        {request.purpose.length > 30 ? '...' : ''}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {request.requestType === 'in-valley' ? (
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            {new Date(request.expenseDate || request.travelDateFrom).toLocaleDateString(undefined, {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col text-sm">
                                          <span className="font-medium">
                                            {new Date(request.travelDateFrom).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                          <span className="text-muted-foreground">
                                            to {new Date(request.travelDateTo).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={cn(
                                        "flex items-center gap-1.5 w-fit",
                                        request.requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
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
                                    <TableCell className="font-medium">
                                      {request.status === 'travel_approved' ? (
                                        <span className="text-muted-foreground italic">Pending</span>
                                      ) : (
                                        <>
                                          Nrs.{request.totalAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 0, 
                                            maximumFractionDigits: 0
                                          })}
                                        </>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getStatusBadgeClass(request.status)}>
                                        {getFormattedStatus(request.status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestClick(request);
                                        }}
                                        className="flex items-center gap-1"
                                      >
                                        {request.status === 'travel_approved' ? 'Add Expenses' : 'View'}
                                        <ArrowRight className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="past">
                        {pastRequests.length === 0 ? (
                          <div className="text-center py-10 bg-muted/20 rounded-md">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No completed requests found</p>
                          </div>
                        ) : (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <FileText size={16} className="mr-2 text-muted-foreground" />
                                      Purpose
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <Calendar size={16} className="mr-2 text-muted-foreground" />
                                      Date
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <FileText size={16} className="mr-2 text-muted-foreground" />
                                      Type
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <DollarSign size={16} className="mr-2 text-muted-foreground" />
                                      Amount
                                    </div>
                                  </TableHead>
                                  <TableHead>
                                    <div className="flex items-center">
                                      <Clock size={16} className="mr-2 text-muted-foreground" />
                                      Status
                                    </div>
                                  </TableHead>
                                  <TableHead>Submitted</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pastRequests.map((request) => (
                                  <TableRow 
                                    key={request.id} 
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRequestClick(request)}
                                  >
                                    <TableCell>
                                      <div className="max-w-[200px] truncate font-medium" title={request.purpose}>
                                        {request.purpose.substring(0, 30)}
                                        {request.purpose.length > 30 ? '...' : ''}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {request.requestType === 'in-valley' ? (
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            {new Date(request.expenseDate || request.travelDateFrom).toLocaleDateString(undefined, {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col text-sm">
                                          <span className="font-medium">
                                            {new Date(request.travelDateFrom).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                          <span className="text-muted-foreground">
                                            to {new Date(request.travelDateTo).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={cn(
                                        "flex items-center gap-1.5 w-fit",
                                        request.requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
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
                                    <TableCell className="font-medium">
                                      Nrs.{request.totalAmount.toLocaleString(undefined, {
                                        minimumFractionDigits: 0, 
                                        maximumFractionDigits: 0
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getStatusBadgeClass(request.status)}>
                                        {getFormattedStatus(request.status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {new Date(request.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestClick(request);
                                        }}
                                        className="flex items-center gap-1"
                                      >
                                        View
                                        <ArrowRight className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
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
      
    </div>
  );
}