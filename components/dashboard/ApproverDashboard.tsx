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
import { cn } from "@/lib/utils";

export default function ApproverDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/requests');
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error refreshing requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply all filters and sorting
  let filteredRequests = [...requests];
  
  // Filter by status
  if (filter !== 'all') {
    filteredRequests = filteredRequests.filter(req => req.status === filter);
  }
  
  // Apply search filter
  if (searchTerm) {
    const lowerCaseSearch = searchTerm.toLowerCase();
    filteredRequests = filteredRequests.filter(req => 
      req.employeeName.toLowerCase().includes(lowerCaseSearch) ||
      req.department.toLowerCase().includes(lowerCaseSearch) ||
      req.purpose.toLowerCase().includes(lowerCaseSearch)
    );
  }
  
  // Apply sorting
  if (sortConfig !== null) {
    filteredRequests.sort((a, b) => {
      // @ts-ignore - dynamic property access
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      // @ts-ignore - dynamic property access
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }
  
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
  
  return (
    <div className="max-w-7xl mx-auto p-6">
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
          {loading ? (
            renderSkeletonTable()
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No travel requests found</p>
              <p className="text-sm text-muted-foreground mb-6">Adjust your filters or check back later for new requests</p>
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
                          request.requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          request.requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        )}>
                          {request.requestType === 'normal' && <FileText className="h-3 w-3" />}
                          {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                          {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                          {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
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
                        ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(request.id)}
                          className="opacity-80 group-hover:opacity-100"
                        >
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
            <div>
              Total requests: {requests.length}
            </div>
            <div>
              Showing {filteredRequests.length} of {requests.length} requests
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}