"use client";                    

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  FileText, 
  Paperclip, 
  Clock, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Download, 
  MapPin, 
  User, 
  Briefcase, 
  Building,
  CreditCard,
  Receipt,
  Coffee,
  Users,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface ValleyExpense {
  id: string;
  requestId: string;
  category: string;
  amount: number;
  description?: string;
}

interface Receipt {
  id: string;
  expenseItemId: string;
  originalFilename: string;
  publicUrl: string;
}

interface ValleyRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  requestType: string;
  project: string;
  purpose: string;
  expenseDate: string;
  location: string;
  description: string;
  paymentMethod: string;
  meetingType?: string;
  meetingParticipants?: string;
  totalAmount: number;
  status: string;
  approverComments?: string;
  checkerComments?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApproverInValleyDetailProps {
  requestId: string;
}

export default function ApproverInValleyDetail({ requestId }: ApproverInValleyDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<ValleyRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ValleyExpense[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  
  useEffect(() => {

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
          setComments(requestData.approverComments);
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
          
          message: 'Failed to load request details. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [requestId]);
  
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
  
  const getStatusIcon = () => {
    if (!request) return null;
    
    switch (request.status) {
      case 'pending':
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
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      case 'travel_approved':
        return 'Approved (Ready for Expenses)';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const formatCategoryName = (category: string) => {
    // Convert category values like "ride-share" to "Ride Share"
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!request) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/valley-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comments: comments,
          role: 'approver'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request status');
      }
      
      const updatedRequest = await response.json();
      setRequest(updatedRequest);
      
      // UPDATED MESSAGE TO BE CONSISTENT WITH ACTUAL STATUS
      setStatusMessage({
        type: 'success',
        message: `Request ${newStatus === 'approved' ? 'approved and ready for expense submission' : 'rejected'}. Redirecting...`
      });
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/approver/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to update request status. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
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
          <CardFooter className="flex justify-center">
            <Button
              onClick={() => router.push('/approver/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Format the expense date
  const expenseDate = new Date(request.expenseDate);
  
  // Safe access to status with fallback
  const status = request.status || 'pending';
  
  // Calculate total from expense items
  const totalAmount = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Determine if actions are allowed
  const canTakeAction = status === 'pending';
  
  // Get the request ID for display, but safely handle undefined
  const displayRequestId = request?.id ? request.id.substring(0, 8) + '...' : 'N/A';
  
  // Render the details tab content
  const renderDetailsTab = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Employee Information
          </h3>
          
          <div className="bg-muted/10 p-4 rounded-md border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{request.employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{request.department}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{request.designation}</p>
            </div>
          </div>
          
          <h3 className="text-lg font-medium flex items-center gap-2 mt-6">
            <FileText className="h-5 w-5 text-primary" />
            Expense Details
          </h3>
          
          <div className="bg-muted/10 p-4 rounded-md border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium">{request.project}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purpose</p>
                <p className="font-medium">{request.purpose.charAt(0).toUpperCase() + request.purpose.slice(1)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Expense Date</p>
                <p className="font-medium">{expenseDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{request.location}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{request.paymentMethod}</p>
            </div>
            
            {request.meetingType && (
              <div>
                <p className="text-sm text-muted-foreground">Meeting Type</p>
                <p className="font-medium">{request.meetingType}</p>
              </div>
            )}
            
            {request.meetingParticipants && (
              <div>
                <p className="text-sm text-muted-foreground">Meeting Participants</p>
                <p className="font-medium whitespace-pre-line">{request.meetingParticipants}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Description
          </h3>
          
          <div className="bg-muted/10 p-4 rounded-md border">
            <p className="whitespace-pre-line">{request.description}</p>
          </div>
          
          <h3 className="text-lg font-medium flex items-center gap-2 mt-6">
            <Receipt className="h-5 w-5 text-primary" />
            Expense Summary
          </h3>
          
          <div className="bg-muted/10 p-4 rounded-md border">
            <div className="divide-y">
              <div className="py-2 grid grid-cols-2">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium text-right">
                  Nrs. {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              
              <div className="py-2 grid grid-cols-2">
                <span className="text-muted-foreground">Submitted On:</span>
                <span className="font-medium text-right">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="py-2 grid grid-cols-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-right">
                  <Badge className={getStatusBadgeClass(status)}>
                    {getFormattedStatus(status)}
                  </Badge>
                </span>
              </div>
              
              <div className="py-2 grid grid-cols-2">
                <span className="text-muted-foreground">Number of Items:</span>
                <span className="font-medium text-right">{expenseItems.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="#" className="flex items-center gap-1">
                <Download size={16} />
                Download Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render the expenses tab content
  const renderExpensesTab = () => (
    <div className="p-6">
      {expenseItems.length === 0 ? (
        <div className="text-center py-10 bg-muted/20 rounded-md">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No expense items found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (Nrs.)</TableHead>
                  <TableHead>Receipts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{formatCategoryName(item.category)}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell className="text-right">{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell>
                      {receipts[item.id] && receipts[item.id].length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {receipts[item.id].map((receipt, idx) => (
                            <a
                              key={receipt.id}
                              href={receipt.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs py-1 px-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                            >
                              <Paperclip size={12} />
                              Receipt {idx + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No receipts</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10 font-medium">
                  <TableCell colSpan={2} className="text-right">Total</TableCell>
                  <TableCell className="text-right">
                    {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render the approval tab content
  const renderActionTab = () => (
    <div className="p-6 space-y-6">
      {statusMessage && (
        <Alert className={`mb-4 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <div className="font-medium">
            {statusMessage.type === 'success' ? 'Success' : 'Error'}
          </div>
          <AlertDescription>
            {statusMessage.message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-medium flex items-center gap-2 text-blue-800">
          <Info className="h-5 w-5 text-blue-600" />
          Approval Decision
        </h3>
        <p className="mt-2 text-blue-700">
          Please review this in-valley reimbursement request and decide whether to approve or reject it.
          If approved, it will be sent to the Finance department for final verification.
        </p>
      </div>
      
      <div className="bg-muted/10 p-4 rounded-md border">
        <h3 className="text-lg font-medium mb-4">Approval Comments</h3>
        <Textarea 
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Enter your comments or notes about this request..."
          className="min-h-[120px]"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => handleStatusUpdate('rejected')}
          disabled={isSubmitting || !canTakeAction}
        >
          <ThumbsDown className="h-5 w-5" />
          Reject Request
        </Button>
        
        <Button
          variant="default"
          size="lg"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => handleStatusUpdate('approved')}
          disabled={isSubmitting || !canTakeAction}
        >
          <CheckCircle2 className="h-5 w-5" />
          Approve Request
        </Button>
      </div>
      
      {!canTakeAction && (
        <Alert className="mt-4 bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <div className="font-medium">Action Not Available</div>
          <AlertDescription>
            This request is in the "{getFormattedStatus(status)}" state and cannot be modified.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

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
          {getStatusIcon()}
          <Badge className={getStatusBadgeClass(status)}>
            {getFormattedStatus(status)}
          </Badge>
        </div>
      </div>
      
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/10">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                In-Valley Reimbursement Request
              </CardTitle>
              <CardDescription className="mt-1">
                Request #{displayRequestId} • Submitted on {new Date(request.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1.5 h-7 px-3">
              <MapPin className="h-3.5 w-3.5" />
              In-Valley
            </Badge>
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
                <TabsTrigger value="action" className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span className="hidden sm:inline">Approval</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="details">
              {renderDetailsTab()}
            </TabsContent>
            
            <TabsContent value="expenses">
              {renderExpensesTab()}
            </TabsContent>
            
            <TabsContent value="action">
              {renderActionTab()}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        
<CardFooter className="border-t p-4 bg-muted/5 flex justify-between">
  <div className="text-sm text-muted-foreground flex items-center gap-1">
    <Calendar className="h-4 w-4" />
    {expenseDate.toLocaleDateString()}
    <span className="mx-2">•</span>
    <div className="flex items-center gap-1">
      <User className="h-4 w-4" />
      <span className="font-medium">{request.employeeName || "Unknown Employee"}</span>
      {request.department && (
        <span className="text-xs text-muted-foreground">({request.department})</span>
      )}
    </div>
  </div>
  
  <div className="flex items-center gap-3">
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-1 h-8"
      asChild
    >
      <Link href="#" target="_blank" rel="noopener noreferrer">
        <Download size={14} />
        Export PDF
      </Link>
    </Button>
  </div>
</CardFooter>
      </Card>
    </div>
  );
}