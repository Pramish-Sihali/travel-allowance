'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Users, Search, Filter, Briefcase, ArrowUpDown, Clock, DollarSign, RefreshCw, ArrowRight, FileText, CreditCard, AlertTriangle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ApproverDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      console.log('Fetched approver requests:', data);
      setRequests(data);
      
      // Filter by status
      const pending = data.filter((req: TravelRequest) => req.status === 'pending');
      const completed = data.filter((req: TravelRequest) => req.status !== 'pending');
      setPendingRequests(pending);
      setCompletedRequests(completed);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    await fetchRequests();
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
        req.employeeName.toLowerCase().includes(lowerCaseSearch) ||
        req.department?.toLowerCase().includes(lowerCaseSearch) ||
        req.purpose?.toLowerCase().includes(lowerCaseSearch)
      );
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
  
  const handleViewDetails = (id: string) => {
    router.push(`/approver/request-detail/${id}`);
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
  
  // Get CSS classes for status badges instead of using variants
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      case 'pending_verification':
        return 'Under Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
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
  
  return (
    <div className="max-w-9xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <Clock size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending Approval</p>
                <p className="text-xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Approved</p>
                <p className="text-xl font-bold">
                  {completedRequests.filter(req => req.status === 'approved' || req.status === 'pending_verification').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Rejected</p>
                <p className="text-xl font-bold">
                  {completedRequests.filter(req => req.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Amount</p>
                <p className="text-xl font-bold">
                  Nrs.{requests
                    .filter(req => req.status === 'approved' || req.status === 'pending_verification')
                    .reduce((sum, req) => sum + req.totalAmount, 0)
                    .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center">
              <Briefcase className="mr-2 text-primary h-5 w-5" />
              <CardTitle>Travel Requests Dashboard</CardTitle>
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
              
              <div className="flex items-center gap-2">
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as 'all' | 'pending' | 'approved' | 'rejected')}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter requests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Requests</SelectItem>
                    <SelectItem value="approved">Approved Requests</SelectItem>
                    <SelectItem value="rejected">Rejected Requests</SelectItem>
                    <SelectItem value="all">All Requests</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline"
                  onClick={handleRefresh} 
                  disabled={loading}
                  size="icon"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
          <CardDescription>
            Manage and review employee travel reimbursement requests
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pending Requests</span>
                <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Processed Requests</span>
                <Badge variant="secondary" className="ml-1">{completedRequests.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {loading ? (
                renderSkeletonTable()
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No pending requests found</p>
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
                            Travel Dates
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
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(request.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{request.employeeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "flex items-center gap-1.5 w-fit",
                              !request.requestType || request.requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              request.requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            )}>
                              {(request.requestType === 'normal' || !request.requestType) && <FileText className="h-3 w-3" />}
                              {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                              {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                              {(request.requestType || 'normal').charAt(0).toUpperCase() + (request.requestType || 'normal').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{request.department}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>
                                {new Date(request.travelDateFrom).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                to {new Date(request.travelDateTo).toLocaleDateString()}
                              </span>
                            </div>
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
                              onClick={() => handleViewDetails(request.id)}
                              className="opacity-80 group-hover:opacity-100"
                            >
                              Review
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {loading ? (
                renderSkeletonTable()
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No processed requests found</p>
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
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(request.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{request.employeeName}</div>
                            </div>
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
                              onClick={() => handleViewDetails(request.id)}
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
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
            <div>
              Total requests: {requests.length}
            </div>
            <div>
              Showing {filteredRequests.length} of {activeTab === 'pending' ? pendingRequests.length : completedRequests.length} requests
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}