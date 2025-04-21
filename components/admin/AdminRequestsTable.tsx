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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default function AdminRequestsTable() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [valleyRequests, setValleyRequests] = useState<TravelRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [currentTab, setCurrentTab] = useState('all');
  
  // Request management state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // Update allRequests when travel or valley requests change
  useEffect(() => {
    setAllRequests([...requests, ...valleyRequests]);
  }, [requests, valleyRequests]);
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch regular travel requests
      const travelResponse = await fetch('/api/requests');
      if (!travelResponse.ok) {
        throw new Error(`Failed to fetch travel requests: ${travelResponse.statusText}`);
      }
      const travelData = await travelResponse.json();
      setRequests(travelData);
      
      // Fetch in-valley requests
      const valleyResponse = await fetch('/api/valley-requests');
      if (!valleyResponse.ok) {
        throw new Error(`Failed to fetch in-valley requests: ${valleyResponse.statusText}`);
      }
      const valleyData = await valleyResponse.json();
      setValleyRequests(valleyData);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      
    } finally {
      setLoading(false);
    }
  };
  
  // Get current requests based on the tab
  const getCurrentRequests = () => {
    switch(currentTab) {
      case 'travel':
        return requests;
      case 'valley':
        return valleyRequests;
      case 'all':
      default:
        return allRequests;
    }
  };
  
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
    const currentRequests = getCurrentRequests();
    let filteredRequests = [...currentRequests];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(request => 
        (request.employeeName && request.employeeName.toLowerCase().includes(lowerCaseSearch)) ||
        (request.department && request.department.toLowerCase().includes(lowerCaseSearch)) ||
        (request.purpose && request.purpose.toLowerCase().includes(lowerCaseSearch)) ||
        (request.project && request.project.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'in-valley') {
        filteredRequests = filteredRequests.filter(request => request.requestType === 'in-valley');
      } else {
        filteredRequests = filteredRequests.filter(request => 
          request.requestType === typeFilter && request.requestType !== 'in-valley'
        );
      }
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

  // Get paginated requests
  const getPaginatedRequests = () => {
    const filteredRequests = getFilteredRequests();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredRequests().length / itemsPerPage);
  
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
      case 'travel_approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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
      case 'travel_approved':
        return 'Travel Approved';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
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
      case 'in-valley':
        return 'bg-teal-100 text-teal-800 border-teal-200';
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
      setIsProcessing(true);
      
      // Determine the API endpoint based on request type
      const endpoint = selectedRequest.requestType === 'in-valley'
        ? `/api/valley-requests/${selectedRequest.id}`
        : `/api/requests/${selectedRequest.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete request');
      }
      
      // Remove the request from the appropriate array
      if (selectedRequest.requestType === 'in-valley') {
        setValleyRequests(valleyRequests.filter(req => req.id !== selectedRequest.id));
      } else {
        setRequests(requests.filter(req => req.id !== selectedRequest.id));
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
      
    
    } catch (error) {
      console.error('Error deleting request:', error);
     
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Handle displaying page numbers for pagination with many pages
            let pageNum;
            if (totalPages <= 5) {
              // Show all page numbers if 5 or fewer
              pageNum = i + 1;
            } else {
              // Show a window of pages around current page
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="mx-1">...</span>}
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };
  
  // Render request summary statistics
  const renderRequestStats = () => {
    const totalCount = allRequests.length;
    const travelCount = requests.length;
    const valleyCount = valleyRequests.length;
    const pendingCount = allRequests.filter(req => req.status === 'pending').length;
    const pendingVerificationCount = allRequests.filter(req => req.status === 'pending_verification').length;
    const approvedCount = allRequests.filter(req => req.status === 'approved').length;
    const rejectedCount = allRequests.filter(req => 
      req.status === 'rejected' || req.status === 'rejected_by_checker'
    ).length;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">
                {travelCount} travel, {valleyCount} in-valley
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">
                {pendingVerificationCount} pending verification
              </p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">
                {(approvedCount / totalCount * 100).toFixed(1)}% approval rate
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">
                {(rejectedCount / totalCount * 100).toFixed(1)}% rejection rate
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
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

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Request Management</h3>
          <Button onClick={fetchRequests} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-800">Error Loading Requests</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Please check your network connection and try again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const filteredRequests = getFilteredRequests();
  const paginatedRequests = getPaginatedRequests();
  const totalAmount = filteredRequests.reduce((sum, req) => sum + (req.totalAmount || 0), 0);
  
  return (
    <div className="space-y-4">
      {/* Stats Row */}
      {renderRequestStats()}
      
      {/* Tab View of Request Types */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="flex gap-2 items-center">
            <FileText className="h-4 w-4" />
            <span>All Requests ({allRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex gap-2 items-center">
            <MapPin className="h-4 w-4" />
            <span>Travel ({requests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="valley" className="flex gap-2 items-center">
            <Building className="h-4 w-4" />
            <span>In-Valley ({valleyRequests.length})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
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
                setCurrentPage(1);
              }} 
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Filters
            </Button>
            
            <span className="font-medium text-sm whitespace-nowrap">
              Total: Nrs.{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={value => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="travel_approved">Travel Approved</SelectItem>
            <SelectItem value="pending_verification">Under Verification</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="rejected_by_checker">Rejected by Finance</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={typeFilter}
          onValueChange={value => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
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
            <SelectItem value="in-valley">In-Valley</SelectItem>
          </SelectContent>
        </Select>
        
        <DatePickerWithRange
          className="w-auto"
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range);
            setCurrentPage(1);
          }}
        />
        
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No requests found</p>
          <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setDateRange(undefined);
              setSortConfig(null);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
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
                      Date {getSortIndicator('travelDateFrom')}
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
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(request.employeeName || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-sm">{request.employeeName || 'Unknown'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.department || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {new Date(request.travelDateFrom).toLocaleDateString()}
                        </span>
                        {request.travelDateFrom !== request.travelDateTo && (
                          <span className="text-xs text-muted-foreground">
                            to {new Date(request.travelDateTo).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.totalAmount ? `Nrs.${request.totalAmount.toLocaleString()}` : 'N/A'}
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
                          {request.requestType === 'in-valley' && <Building size={12} />}
                          {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1).replace('-', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewRequest(request)}
                          title="View details"
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
                              title="Delete request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-red-600">Delete Request</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this request? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="py-4">
                                <div className="flex items-start gap-4 p-4 border rounded-md bg-red-50">
                                  <FileText className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                                  <div>
                                    <p className="font-medium">{selectedRequest.purpose || selectedRequest.requestType}</p>
                                    <p className="text-sm text-muted-foreground">From {selectedRequest.employeeName}</p>
                                    <p className="text-sm font-medium mt-1">
                                      {selectedRequest.totalAmount ? `Nrs.${selectedRequest.totalAmount.toLocaleString()}` : 'No amount specified'}
                                    </p>
                                    <div className="mt-1 flex gap-2">
                                      <Badge className={getStatusBadgeClass(selectedRequest.status)}>
                                        {getFormattedStatus(selectedRequest.status)}
                                      </Badge>
                                      <Badge className={getRequestTypeBadgeClass(selectedRequest.requestType)}>
                                        {selectedRequest.requestType.charAt(0).toUpperCase() + selectedRequest.requestType.slice(1).replace('-', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-red-600 mt-4 flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  This will permanently delete all data related to this request.
                                </p>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDeleteDialogOpen(false);
                                  setSelectedRequest(null);
                                }}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteRequest}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : 'Delete Request'}
                              </Button>
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
          
          {/* Pagination controls */}
          {renderPagination()}
        </>
      )}
      
      <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
        <div>
          Total requests: {getCurrentRequests().length}
        </div>
        <div>
          Showing {filteredRequests.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredRequests.length)} of ` : ''}{filteredRequests.length} requests
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
              Complete information about this {selectedRequest?.requestType === 'in-valley' ? 'in-valley' : 'travel'} request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedRequest.employeeName || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedRequest.employeeName || 'Unknown User'}</h3>
                  <p className="text-muted-foreground">{selectedRequest.department || 'No Department'}</p>
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
                    <p className="font-medium">{selectedRequest.purpose || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      {selectedRequest.requestType === 'in-valley' ? 'Expense Date' : 'Travel Dates'}
                    </h4>
                    <p className="font-medium">
                      {new Date(selectedRequest.travelDateFrom).toLocaleDateString()}
                      {selectedRequest.travelDateFrom !== selectedRequest.travelDateTo && (
                        <> to {new Date(selectedRequest.travelDateTo).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Request Type</h4>
                    <Badge className={getRequestTypeBadgeClass(selectedRequest.requestType)}>
                      <div className="flex items-center gap-1">
                        {selectedRequest.requestType === 'normal' && <FileText size={12} />}
                        {selectedRequest.requestType === 'advance' && <CreditCard size={12} />}
                        {selectedRequest.requestType === 'emergency' && <AlertTriangle size={12} />}
                        {selectedRequest.requestType === 'in-valley' && <Building size={12} />}
                        {selectedRequest.requestType.charAt(0).toUpperCase() + selectedRequest.requestType.slice(1).replace('-', ' ')}
                      </div>
                    </Badge>
                  </div>
                  
                  {selectedRequest.project && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Project</h4>
                      <p className="font-medium">{selectedRequest.project}</p>
                    </div>
                  )}
                  
                  {selectedRequest.location && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                      <p className="font-medium">{selectedRequest.location}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h4>
                    <p className="text-xl font-bold text-primary">
                      {selectedRequest.totalAmount ? `Nrs.${selectedRequest.totalAmount.toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                  
                  {/* {selectedRequest.previousOutstandingAdvance > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Previous Outstanding Advance</h4>
                      <p className="font-medium text-amber-600">Nrs.{selectedRequest.previousOutstandingAdvance.toLocaleString()}</p>
                    </div>
                  )}
                   */}
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
                            selectedRequest.status === 'approved' || selectedRequest.status === 'travel_approved' || selectedRequest.status === 'pending_verification' 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}></div>
                          <span>
                            {selectedRequest.status === 'approved' && 'Approved'}
                            {selectedRequest.status === 'travel_approved' && 'Travel details approved'}
                            {selectedRequest.status === 'pending_verification' && 'Approved by manager, pending finance verification'}
                            {selectedRequest.status === 'rejected' && 'Rejected by manager'}
                            {selectedRequest.status === 'rejected_by_checker' && 'Rejected by finance'}
                          </span>
                        </div>
                      )}
                      
                      {/* Show timestamps for various status changes */}
                      {selectedRequest.travelDetailsApprovedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span>Travel approved on {new Date(selectedRequest.travelDetailsApprovedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {selectedRequest.expensesSubmittedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                          <span>Expenses submitted on {new Date(selectedRequest.expensesSubmittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Comments</h4>
                
                {selectedRequest.approverComments && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">Approver</Badge>
                      <span className="text-sm text-muted-foreground">Comment</span>
                    </div>
                    <p className="text-sm">{selectedRequest.approverComments}</p>
                  </div>
                )}
                
                {selectedRequest.checkerComments && (
                  <div className="bg-purple-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">Finance</Badge>
                      <span className="text-sm text-muted-foreground">Comment</span>
                    </div>
                    <p className="text-sm">{selectedRequest.checkerComments}</p>
                  </div>
                )}
                
                {!selectedRequest.approverComments && !selectedRequest.checkerComments && (
                  <p className="text-sm text-muted-foreground">No comments available for this request.</p>
                )}
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
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Request
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