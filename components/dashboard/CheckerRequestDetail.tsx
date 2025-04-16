'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Calculator, 
  Receipt as ReceiptIcon, 
  Ban, 
  ThumbsDown, 
  ThumbsUp, 
  Loader2, 
  User,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Import the tab content components for reuse
import RequestDetailsTab from '@/components/dashboard/RequestDetailsTab';
import RequestExpensesTab from '@/components/dashboard/RequestExpensesTab';

interface CheckerRequestDetailProps {
  requestId: string;
}

export default function CheckerRequestDetail({ requestId }: CheckerRequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [verificationComment, setVerificationComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
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
  
  const handleVerification = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comments: verificationComment,
          role: 'checker'  // Identify that this update is from checker
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${status} request`);
      }
      
      const updatedRequest = await response.json();
      setRequest(updatedRequest);
      
      // Show success message
      setSuccessMessage(`Request has been ${status === 'approved' ? 'approved' : 'rejected'} successfully. Redirecting...`);
      
      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/checker/dashboard');
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
      case 'pending_verification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected_by_checker':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return <Clock size={18} className="text-purple-500" />;
      case 'approved':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'rejected_by_checker':
        return <AlertTriangle size={18} className="text-red-500" />;
      case 'rejected':
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return null;
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
  
  // Calculate combined total (including previous outstanding advance)
  const calculateCombinedTotal = () => {
    if (!request) return 0;
    return request.totalAmount + (request.previousOutstandingAdvance || 0);
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
          onClick={() => router.push('/checker/dashboard')}
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
              onClick={() => router.push('/checker/dashboard')}
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
  const status = request.status || 'pending_verification';
  
  // Safe access to requestType with fallback
  const requestType = request.requestType || 'normal';
      
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
          onClick={() => router.push('/checker/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <Badge className={getStatusBadgeClass(status)}>
            {getFormattedStatus(status)}
          </Badge>
        </div>
      </div>
      
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-600" />
                Financial Verification
              </CardTitle>
              <CardDescription className="mt-1">
                Request #{displayRequestId} • From {request.employeeName} • {request.department}
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="bg-purple-50 text-purple-900 border-purple-200">
                <Calculator size={12} className="mr-1" />
                Finance Review
              </Badge>
              
              <Badge className={cn(
                "flex items-center gap-1.5 h-7 px-3",
                requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                'bg-red-100 text-red-800 border-red-200'
              )}>
                {requestType === 'normal' && <FileText className="h-3.5 w-3.5" />}
                {requestType === 'advance' && <CreditCard className="h-3.5 w-3.5" />}
                {requestType === 'emergency' && <AlertTriangle className="h-3.5 w-3.5" />}
                {requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/5 px-6 py-2">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <User size={16} />
                  <span className="hidden sm:inline">Request Details</span>
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex items-center gap-2">
                  <DollarSign size={16} />
                  <span className="hidden sm:inline">Expenses</span>
                </TabsTrigger>
                <TabsTrigger value="verification" className="flex items-center gap-2">
                  <Calculator size={16} />
                  <span className="hidden sm:inline">Verification</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="details">
              <RequestDetailsTab request={request} travelDates={travelDates} />
            </TabsContent>
            
            <TabsContent value="expenses">
              <RequestExpensesTab 
                expenseItems={expenseItems} 
                receipts={receipts} 
                totalAmount={request.totalAmount || 0}
                previousOutstandingAdvance={request.previousOutstandingAdvance}
              />
            </TabsContent>
            
            <TabsContent value="verification" className="p-6 space-y-6">
              {request.status !== 'pending_verification' ? (
                <>
                  <Alert className={request.status === 'approved' 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                  }>
                    {request.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>{getFormattedStatus(request.status)}</AlertTitle>
                    <AlertDescription>
                      This request has already been {request.status === 'rejected_by_checker' ? 'rejected' : request.status}.
                      {request.checkerComments && (
                        <div className="mt-2 p-3 bg-white/50 rounded-md border border-current/20">
                          <p className="font-medium text-sm">Verification Comments:</p>
                          <p className="text-sm mt-1">{request.checkerComments}</p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/checker/dashboard')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      Back to Dashboard
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Card className="border-l-4 border-l-purple-400 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ReceiptIcon size={16} className="text-purple-500" />
                          Financial Verification
                        </CardTitle>
                        <div className="flex flex-col items-end">
                          <Badge className="mb-1 bg-primary/10 text-primary border-0 font-bold">
                            Request Total: Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </Badge>
                          {request.previousOutstandingAdvance > 0 && (
                            <Badge className="bg-amber-100 text-amber-800 border-0 font-bold text-xs">
                              <AlertTriangle size={10} className="mr-1" />
                              Previous Balance: Nrs.{request.previousOutstandingAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Badge>
                          )}
                          {request.previousOutstandingAdvance > 0 && (
                            <Badge className="mt-1 bg-purple-100 text-purple-800 border-0 font-bold text-xs">
                              Combined Total: Nrs.{calculateCombinedTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        Verify all expenses and ensure they comply with financial policies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Please review the expenses in this travel request carefully. Ensure all amounts are appropriate and have proper supporting documentation. The approver has already approved this request and it's now awaiting your financial verification.
                        </p>
                        
                        {request.approverComments && (
                          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <AlertTitle>Approver Comments</AlertTitle>
                            <AlertDescription>
                              {request.approverComments}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="pt-4">
                          <label className="block mb-2 text-sm font-medium">Verification Comments</label>
                          <Textarea
                            value={verificationComment}
                            onChange={(e) => setVerificationComment(e.target.value)}
                            placeholder="Add your comments regarding the financial verification..."
                            className="min-h-[120px] resize-none"
                          />
                          <div className="flex justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              Your comments will be visible to the requester
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {verificationComment.length} characters
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Request Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Employee:</span>
                          <span className="text-sm">{request.employeeName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Department:</span>
                          <span className="text-sm">{request.department}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Project:</span>
                          <span className="text-sm capitalize">{request.project === 'other' ? 
                            request.projectOther : 
                            request.project?.replace('-', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Location:</span>
                          <span className="text-sm capitalize">{request.location === 'other' ? 
                            request.locationOther : 
                            request.location}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Travel Period:</span>
                          <span className="text-sm">
                            {new Date(request.travelDateFrom).toLocaleDateString()} - {new Date(request.travelDateTo).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Purpose:</span>
                          <span className="text-sm">{request.purpose}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Verification Checklist</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <CheckCircle size={12} />
                          </div>
                          <span className="text-sm">All expenses are supported by valid receipts</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <CheckCircle size={12} />
                          </div>
                          <span className="text-sm">Expense amounts comply with company policy</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <CheckCircle size={12} />
                          </div>
                          <span className="text-sm">Calculations and totals are correct</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <CheckCircle size={12} />
                          </div>
                          <span className="text-sm">All required details are provided</span>
                        </div>
                        
                        <div className="flex items-start gap-2 mt-4 p-2 bg-amber-50 rounded-md border border-amber-200">
                          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Financial Verification Is Final</p>
                            <p className="text-xs text-amber-700">
                              Once approved, funds will be released to the employee. Make sure all documentation is complete.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/checker/dashboard')}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      Back to Dashboard
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVerification('rejected')}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Ban size={16} />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleVerification('approved')}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-4 bg-muted/5 flex justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Request #{displayRequestId.substring(0, 6)}
            <span className="mx-2">•</span>
            <Clock className="h-4 w-4" />
            Submitted: {new Date(request.createdAt).toLocaleDateString()}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8"
              onClick={() => setActiveTab('expenses')}
            >
              <ReceiptIcon size={14} />
              View Receipts
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}