'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest, ExpenseItem, Receipt } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, FileText, DollarSign } from 'lucide-react';

// Define the interfaces for the tab components
interface RequestDetailsTabProps {
  request: TravelRequest;
  travelDates: {
    start: Date;
    end: Date;
    duration: number;
  };
}

interface RequestExpensesTabProps {
  expenseItems: ExpenseItem[];
  receipts: Record<string, Receipt[]>;
  totalAmount: number;
}

interface RequestApprovalTabProps {
  request: TravelRequest;
  approvalComment: string;
  setApprovalComment: React.Dispatch<React.SetStateAction<string>>;
  handleApproveReject: (status: 'approved' | 'rejected') => Promise<void>;
  isSubmitting: boolean;
  router: ReturnType<typeof useRouter>;
}

// Import the tab content components
import RequestDetailsTab from './RequestDetailsTab';
import RequestExpensesTab from './RequestExpensesTab';
import RequestApprovalTab from './RequestApprovalTab';

interface RequestDetailProps {
  requestId: string;
}

export default function RequestDetail({ requestId }: RequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        // Fetch request
        const requestResponse = await fetch(`/api/requests/${requestId}`);
        if (!requestResponse.ok) {
          throw new Error('Failed to fetch request details');
        }
        const requestData = await requestResponse.json();
        setRequest(requestData);
        
        // Fetch expense items
        const expensesResponse = await fetch(`/api/expenses?requestId=${requestId}`);
        if (!expensesResponse.ok) {
          throw new Error('Failed to fetch expense items');
        }
        const expensesData = await expensesResponse.json();
        setExpenseItems(expensesData);
        
        // Fetch receipts for each expense item
        const receiptsMap: Record<string, Receipt[]> = {};
        for (const expense of expensesData) {
          const receiptsResponse = await fetch(`/api/receipts?expenseItemId=${expense.id}`);
          if (receiptsResponse.ok) {
            const receiptsData = await receiptsResponse.json();
            receiptsMap[expense.id] = receiptsData;
          }
        }
        setReceipts(receiptsMap);
      } catch (error) {
        console.error('Error fetching request details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [requestId]);
  
  const handleApproveReject = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      console.log('Approving/rejecting request:', requestId, 'with status:', status);
      
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comments: approvalComment,
          role: 'approver'  // Identify that this update is from approver
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API error response:', responseData);
        throw new Error(`Failed to ${status} request: ${responseData.error || response.statusText}`);
      }
      
      console.log('Request updated successfully:', responseData);
      setRequest(responseData);
      
      // Show appropriate success message based on status
      if (status === 'approved') {
        setSuccessMessage(`Request has been approved and sent to Finance for verification. Redirecting...`);
      } else {
        setSuccessMessage(`Request has been rejected. Redirecting...`);
      }
      
      // Display success state for 2 seconds before navigating
      setTimeout(() => {
        router.push('/approver/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      setErrorMessage(`There was an error ${status === 'approved' ? 'approving' : 'rejecting'} the request. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} className="text-amber-500" />;
      case 'approved':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'rejected':
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2 mb-6"
          onClick={() => router.push('/approver/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        
        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-center">Request Not Found</CardTitle>
            <CardDescription className="text-center text-red-500">
              Request not found or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => router.push('/approver/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const travelDates = {
    start: new Date(request.travelDateFrom),
    end: new Date(request.travelDateTo),
    duration: Math.ceil((new Date(request.travelDateTo).getTime() - new Date(request.travelDateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
  };
  
  // Safe display of request ID
  const displayRequestId = typeof requestId === 'string' && requestId ? 
    requestId.substring(0, 8) + '...' : 
    'N/A';

  // Safe access to status with fallback
  const status = request.status || 'pending';
      
  return (
    <div className="max-w-6xl mx-auto p-6">
      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      {errorMessage && (
        <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
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
          {getStatusIcon(status)}
          <Badge className={getStatusBadgeClass(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardTitle className="text-xl">Travel Request Review</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Request #{displayRequestId}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="details" className="w-full">
            <div className="px-6 pt-6 border-b">
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
            
            <TabsContent value="details" className="m-0">
              <RequestDetailsTab 
                request={request} 
                travelDates={travelDates} 
              />
            </TabsContent>
            
            <TabsContent value="expenses" className="m-0">
              <RequestExpensesTab 
                expenseItems={expenseItems} 
                receipts={receipts} 
                totalAmount={request.totalAmount || 0} 
              />
            </TabsContent>
            
            <TabsContent value="approval" className="m-0">
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
      </Card>
    </div>
  );
}