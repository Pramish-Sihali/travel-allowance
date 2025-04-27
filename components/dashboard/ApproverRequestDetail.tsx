// Enhanced ApproverRequestDetail.tsx component that properly displays emergency/advance request information

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TravelRequest, ExpenseItem, Receipt } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import icons
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Info,
  Calendar,
  UserIcon,
  CreditCard,
  Users,
  MapPin
} from 'lucide-react';

import { cn } from "@/lib/utils";
import RequestDetailsTab from './RequestDetailsTab';
import RequestExpensesTab from './RequestExpensesTab';
import RequestApprovalTab from './RequestApprovalTab';

interface ApproverRequestDetailProps {
  requestId: string;
}

export default function ApproverRequestDetail({ requestId }: ApproverRequestDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);
  
  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);
  
  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      
      // Determine if this is a travel or in-valley request based on URL
      const isInValley = window.location.pathname.includes('/in-valley/');
      const apiPath = isInValley 
        ? `/api/valley-requests/${requestId}`
        : `/api/requests/${requestId}`;
      
      console.log(`Fetching ${isInValley ? 'in-valley' : 'travel'} request details from: ${apiPath}`);
      
      // Fetch request details
      const requestResponse = await fetch(apiPath);
      if (!requestResponse.ok) {
        throw new Error(`Failed to fetch request details: ${requestResponse.statusText}`);
      }
      const requestData = await requestResponse.json();
      console.log('Fetched request data:', requestData);
      
      // Ensure employee name is properly set
      if (!requestData.employeeName && requestData.employee_name) {
        requestData.employeeName = requestData.employee_name;
      }
      
      // Add a fallback name if neither exists
      if (!requestData.employeeName && !requestData.employee_name) {
        requestData.employeeName = "Unknown Employee";
      }
      
      // Fetch employee details from user profile API if we have employeeId
      if (requestData.employeeId || requestData.employee_id) {
        const employeeId = requestData.employeeId || requestData.employee_id;
        try {
          console.log(`Fetching employee profile for ID: ${employeeId}`);
          const employeeResponse = await fetch(`/api/user/${employeeId}/profile`);
          
          if (employeeResponse.ok) {
            const employeeData = await employeeResponse.json();
            console.log('Fetched employee profile data:', employeeData);
            
            // Update employee information with most recent data
            requestData.employeeName = employeeData.name || requestData.employeeName;
            requestData.department = employeeData.department || requestData.department;
            requestData.designation = employeeData.designation || requestData.designation;
          } else {
            console.warn(`Failed to fetch employee profile: ${employeeResponse.statusText}`);
          }
        } catch (error) {
          console.error('Error fetching employee details:', error);
          // Continue with the data we have - don't fail the entire operation
        }
      }
      
      console.log('Final request data with employee info:', requestData);
      setRequest(requestData);
      
      // Set previous comments if they exist
      if (requestData.approverComments) {
        setApprovalComment(requestData.approverComments);
      }
      
      // Fetch expense items if appropriate for this request
      if ((isInValley && requestData.status !== 'pending') || 
          (!isInValley && requestData.phase === 2)) {
        
        // Fetch expense items
        const expensesPath = isInValley
          ? `/api/valley-expenses?requestId=${requestId}`
          : `/api/expenses?requestId=${requestId}`;
        
        console.log(`Fetching expense items from: ${expensesPath}`);
        const expensesResponse = await fetch(expensesPath);
        
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          console.log('Fetched expense items:', expensesData);
          setExpenseItems(expensesData);
          
          // Fetch receipts for each expense item
          const receiptsMap: Record<string, Receipt[]> = {};
          
          for (const expense of expensesData) {
            console.log(`Fetching receipts for expense item: ${expense.id}`);
            const receiptsResponse = await fetch(`/api/receipts?expenseItemId=${expense.id}`);
            
            if (receiptsResponse.ok) {
              const receiptsData = await receiptsResponse.json();
              console.log(`Found ${receiptsData.length} receipts for expense item ${expense.id}`);
              receiptsMap[expense.id] = receiptsData;
            } else {
              console.warn(`Failed to fetch receipts for expense ${expense.id}: ${receiptsResponse.statusText}`);
            }
          }
          
          setReceipts(receiptsMap);
        } else {
          console.warn(`Failed to fetch expense items: ${expensesResponse.statusText}`);
        }
      } else {
        console.log('Skipping expense items fetching for this request state');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      setStatusMessage({
        type: 'error',
        title: 'Error',
        message: 'Failed to load request details. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproveReject = async (status: 'approved' | 'rejected') => {
    if (!request) return;
    
    setIsSubmitting(true);
    setStatusMessage(null);
    
    try {
      const apiPath = request.requestType === 'in-valley'
        ? `/api/valley-requests/${requestId}`
        : `/api/requests/${requestId}`;
      
      const response = await fetch(apiPath, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comments: approvalComment,
          role: 'approver'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request status');
      }
      
      const updatedRequest = await response.json();
      setRequest(updatedRequest);
      
      // UPDATED MESSAGE TO BE CONSISTENT
      setStatusMessage({
        type: 'success',
        title: status === 'approved' ? 'Request Approved' : 'Request Rejected',
        message: status === 'approved' 
          ? 'Request has been approved and is ready for expense submission.' 
          : 'Request has been rejected.'
      });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/approver/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusMessage({
        type: 'error',
        title: 'Error',
        message: `Failed to ${status} request. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
      case 'travel_approved':
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'travel_approved':
        return <Clock size={20} className="text-amber-500" />;
      case 'pending_verification':
        return <Info size={20} className="text-purple-500" />;
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
      case 'rejected_by_checker':
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };
  
  const getFormattedStatus = (status: string) => {
    switch (status) {
      case 'travel_approved':
        return 'Approved (Ready for Expenses)';
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Function to get a badge for request type
  const getRequestTypeBadge = (requestType: string | undefined) => {
    switch (requestType) {
      case 'normal':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Normal
          </Badge>
        );
      case 'advance':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Advance
          </Badge>
        );
      case 'emergency':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Emergency
          </Badge>
        );
      case 'group':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Group Travel
          </Badge>
        );
      case 'in-valley':
        return (
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            In-Valley
          </Badge>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="h-48 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="h-72 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2 mb-6"
          onClick={() => router.push('/approver/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Request not found</AlertTitle>
          <AlertDescription>
            This request could not be found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const travelDates = {
    start: new Date(request.travelDateFrom),
    end: new Date(request.travelDateTo),
    duration: Math.ceil((new Date(request.travelDateTo).getTime() - new Date(request.travelDateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push('/approver/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(request.status)}
          <Badge className={getStatusBadgeClass(request.status)}>
            {getFormattedStatus(request.status)}
          </Badge>
        </div>
      </div>
      
      {statusMessage && (
        <Alert className={cn(
          "mb-6",
          statusMessage.type === 'success' ? "bg-green-50 text-green-800 border-green-200" :
          statusMessage.type === 'error' ? "bg-red-50 text-red-800 border-red-200" :
          statusMessage.type === 'warning' ? "bg-amber-50 text-amber-800 border-amber-200" :
          "bg-blue-50 text-blue-800 border-blue-200"
        )}>
          {statusMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {statusMessage.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
          {statusMessage.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {statusMessage.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
          
          {statusMessage.title && <AlertTitle>{statusMessage.title}</AlertTitle>}
          <AlertDescription>{statusMessage.message}</AlertDescription>
        </Alert>
      )}
      
      <Card className="border shadow-sm mb-6">
        <CardHeader className="border-b bg-muted/10">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  {request.requestType === 'in-valley' ? 'In-Valley Request Review' : 'Travel Request Review'}
                </CardTitle>
                {getRequestTypeBadge(request.requestType)}
              </div>
              <CardDescription>
                Request ID: {requestId.substring(0, 8)}... • Submitted by {request.employeeName} on {new Date(request.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/5 px-6 py-2">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <FileText size={16} />
                  <span className="hidden sm:inline">Request Details</span>
                </TabsTrigger>

                <TabsTrigger value="expenses" className="flex items-center gap-2">
                  <DollarSign size={16} />
                  <span className="hidden sm:inline">Expenses</span>
                </TabsTrigger>

                <TabsTrigger value="approval" className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span className="hidden sm:inline">Approval</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="details">
              <RequestDetailsTab 
                request={request} 
                travelDates={travelDates} 
              />
            </TabsContent>
            
            <TabsContent value="expenses">
              <RequestExpensesTab 
                expenseItems={expenseItems} 
                receipts={receipts} 
                totalAmount={request.totalAmount || 0}
                previousOutstandingAdvance={request.previousOutstandingAdvance}
              />
            </TabsContent>
            
            <TabsContent value="approval">
              <RequestApprovalTab 
                request={request}
                approvalComment={approvalComment}
                setApprovalComment={setApprovalComment}
                handleApproveReject={handleApproveReject}
                isSubmitting={isSubmitting}
                router={router}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-4 bg-muted/5 flex justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {request.requestType === 'in-valley' ? (
              <>
                <Calendar className="h-4 w-4" />
                {new Date(request.expenseDate || request.travelDateFrom).toLocaleDateString()}
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                {travelDates.start.toLocaleDateString()} - {travelDates.end.toLocaleDateString()}
                <span className="mx-2">•</span>
                <span>{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</span>
              </>
            )}
            <span className="mx-2">•</span>
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              <span className="font-medium">{request.employeeName || "Unknown Employee"}</span>
              {request.department && (
                <span className="text-xs text-muted-foreground">({request.department})</span>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}