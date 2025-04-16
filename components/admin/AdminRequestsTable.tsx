'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DatePickerWithRange,
  DateRange 
} from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  RefreshCw,
  Filter,
  ArrowUpDown,
  Calendar,
  DollarSign,
  FileText,
  User,
  AlertTriangle,
  BarChart,
  ClipboardCheck,
  ArrowRight,
  UserCircle,
  Eye,
  CreditCard,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function AdminRequestsTable() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // Request management state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  
  // Fetch requests on component mount
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
  
  // Request sort by column
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sorted and filtered requests
  const getFilteredRequests = () => {
    let filteredRequests = [...requests];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(request => 
        request.employeeName?.toLowerCase().includes(lowerCaseSearch) ||
        request.department?.toLowerCase().includes(lowerCaseSearch) ||
        request.purpose?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.requestType === typeFilter);
    }
    
    // Apply date range filter
    if (dateRange?.from && dateRange?.to) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      filteredRequests = filteredRequests.filter(request => {
        const travelDateFrom = new Date(request.travelDateFrom);
        return travelDateFrom >= fromDate && travelDateFrom <= toDate;
      });
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      filteredRequests.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof TravelRequest];
        const bValue = b[sortConfig.key as keyof TravelRequest];
        
        // Handle date comparisons
        if (
          sortConfig.key === 'travelDateFrom' || 
          sortConfig.key === 'travelDateTo' || 
          sortConfig.key === 'createdAt'
        ) {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          
          if (aDate < bDate) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aDate > bDate) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
        
        // Handle number comparisons
        if (sortConfig.key === 'totalAmount') {
          const aNum = Number(aValue) || 0;
          const bNum = Number(bValue) || 0;
          
          if (aNum < bNum) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aNum > bNum) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
        
        // Handle string comparisons
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredRequests;
  };
  
  // Get sort indicator for table headers
  const getSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown size={14} className="ml-1 text-primary rotate-0" />;
    }
    
    return <ArrowUpDown size={14} className="ml-1 text-primary rotate-180" />;
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get status badge style
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

  // Get formatted status text
  const getFormattedStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'pending_verification':
        return 'Under Verification';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get request type badge style
  const getRequestTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advance':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Function to handle viewing a request
  const handleViewRequest = (request: TravelRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };
  
  // Function to handle deleting a request
  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete request');
      }
      
      // Remove the request from the array
      const updatedRequests = requests.filter(request => request.id !== selectedRequest.id);
      setRequests(updatedRequests);
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[220px]" />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  const filteredRequests = getFilteredRequests();
  const totalAmount = filteredRequests.reduce((sum, req) => sum + req.totalAmount, 0);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search requests by employee, department, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setDateRange(undefined);
              setSortConfig(null);
            }} 
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Filters
          </Button>
          
          <span className="font-medium text-sm">
            Total: Nrs.{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={value => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pending_verification">Under Verification</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="rejected_by_checker">Rejected by Finance</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={typeFilter}
          onValueChange={value => setTypeFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="advance">Advance</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        
        <DatePickerWithRange
          className="w-auto"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>
      
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No requests found</p>
          <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-muted-foreground" />
                    Employee
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('department')}
                >
                  <div className="flex items-center">
                    Department {getSortIndicator('department')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('travelDateFrom')}
                >
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-muted-foreground" />
                    Travel Date {getSortIndicator('travelDateFrom')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('totalAmount')}
                >
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-2 text-muted-foreground" />
                    Amount {getSortIndicator('totalAmount')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">
                    Status {getSortIndicator('status')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('requestType')}
                >
                  <div className="flex items-center">
                    Type {getSortIndicator('requestType')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(request.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-sm">{request.employeeName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {new Date(request.travelDateFrom).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        to {new Date(request.travelDateTo).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    Nrs.{request.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(request.status)}>
                      {getFormattedStatus(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRequestTypeBadgeClass(request.requestType)}>
                      <div className="flex items-center gap-1">
                        {request.requestType === 'normal' && <FileText size={12} />}
                        {request.requestType === 'advance' && <CreditCard size={12} />}
                        {request.requestType === 'emergency' && <AlertTriangle size={12} />}
                        {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Dialog open={isDeleteDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setSelectedRequest(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Request</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this request? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedRequest && (
                            <div className="py-4">
                              <div className="flex items-start gap-4 p-4 border rounded-md bg-red-50">
                                <FileText className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                  <p className="font-medium">{selectedRequest.purpose}</p>
                                  <p className="text-sm text-muted-foreground">From {selectedRequest.employeeName}</p>
                                  <p className="text-sm font-medium mt-1">
                                    Nrs.{selectedRequest.totalAmount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsDeleteDialogOpen(false);
                              setSelectedRequest(null);
                            }}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteRequest}>Delete Request</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
      
      {/* Request Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this travel request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedRequest.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedRequest.employeeName}</h3>
                  <p className="text-muted-foreground">{selectedRequest.department}</p>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <Badge className={getStatusBadgeClass(selectedRequest.status)}>
                    {getFormattedStatus(selectedRequest.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground mt-1">
                    Created on {new Date(selectedRequest.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Purpose</h4>
                    <p className="font-medium">{selectedRequest.purpose}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Travel Dates</h4>
                    <p className="font-medium">
                      {new Date(selectedRequest.travelDateFrom).toLocaleDateString()} to {new Date(selectedRequest.travelDateTo).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Request Type</h4>
                    <Badge className={getRequestTypeBadgeClass(selectedRequest.requestType)}>
                      <div className="flex items-center gap-1">
                        {selectedRequest.requestType === 'normal' && <FileText size={12} />}
                        {selectedRequest.requestType === 'advance' && <CreditCard size={12} />}
                        {selectedRequest.requestType === 'emergency' && <AlertTriangle size={12} />}
                        {selectedRequest.requestType.charAt(0).toUpperCase() + selectedRequest.requestType.slice(1)}
                      </div>
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h4>
                    <p className="text-xl font-bold text-primary">
                      Nrs.{selectedRequest.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Request ID</h4>
                    <p className="font-mono text-sm bg-muted/20 p-1 rounded">{selectedRequest.id}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status History</h4>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>Created on {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedRequest.status !== 'pending' && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`h-2 w-2 rounded-full ${
                            selectedRequest.status === 'approved' || selectedRequest.status === 'pending_verification' 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}></div>
                          <span>
                            {selectedRequest.status === 'approved' && 'Approved'}
                            {selectedRequest.status === 'pending_verification' && 'Approved by manager, pending finance verification'}
                            {selectedRequest.status === 'rejected' && 'Rejected by manager'}
                            {selectedRequest.status === 'rejected_by_checker' && 'Rejected by finance'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/10 p-4 rounded-md border mt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BarChart size={16} className="text-primary" />
                  Expense Items
                </h4>
                <div className="space-y-3">
                  {/* We'd fetch and display actual expense items here */}
                  <div className="text-muted-foreground text-sm text-center py-4">
                    Expense details would be fetched from the API
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <UserCircle size={16} className="text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Employee ID: {selectedRequest.employeeId}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle size={14} />
                    Process Request
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}