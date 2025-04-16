'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelRequest, ExpenseItem, Receipt } from '@/types';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  ChevronRight,
  CreditCard,
  Calculator,
  Navigation
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Import the components
import RequestDetailsTab from './RequestDetailsTab';
import RequestExpensesTab from './RequestExpensesTab';

interface EmployeeRequestDetailProps {
  requestId: string;
}

export default function EmployeeRequestDetail({ requestId }: EmployeeRequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
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
        return <Calculator size={20} className="text-purple-500" />;
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
        return 'Under Financial Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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
          onClick={() => router.push('/employee/dashboard')}
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
              onClick={() => router.push('/employee/dashboard')}
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
  
  const travelDates = {
    start: new Date(request.travelDateFrom),
    end: new Date(request.travelDateTo),
    duration: Math.ceil((new Date(request.travelDateTo).getTime() - new Date(request.travelDateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
  };

  // Get the request ID for display, but safely handle undefined
  const displayRequestId = request?.id ? request.id.substring(0, 8) + '...' : 'N/A';
  
  // Safe access to status with fallback
  const status = request.status || 'pending';
  
  // Safe access to requestType with fallback
  const requestType = request.requestType || 'normal';
  
  const statusAlerts = () => {
    if (status === 'rejected') {
      return (
        <Alert className="bg-red-50 text-red-800 border-red-200 mb-6">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Request Rejected</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Your travel request has been rejected. Please contact your supervisor for more information.</p>
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 mt-2 text-red-700 border-red-300 hover:bg-red-100">
              <ExternalLink size={12} />
              Contact Supervisor
            </Button>
          </AlertDescription>
        </Alert>
      );
    } else if (status === 'rejected_by_checker') {
      return (
        <Alert className="bg-red-50 text-red-800 border-red-200 mb-6">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Request Rejected by Finance</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Your travel request did not pass financial verification. Please review the comments and contact the finance department.</p>
            {request.checkerComments && (
              <div className="bg-white/50 p-3 rounded-md border border-red-200 mb-2">
                <p className="text-sm font-medium">Finance Comments:</p>
                <p className="text-sm">{request.checkerComments}</p>
              </div>
            )}
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 mt-2 text-red-700 border-red-300 hover:bg-red-100">
              <ExternalLink size={12} />
              Contact Finance
            </Button>
          </AlertDescription>
        </Alert>
      );
    } else if (status === 'approved') {
      return (
        <Alert className="bg-green-50 text-green-800 border-green-200 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Request Approved</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Your travel request has been approved. Please collect your advance from the Finance department.</p>
            <p className="mb-3">Remember to submit all receipts within 3 days of returning from your travel.</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 text-green-700 border-green-300 hover:bg-green-100">
                <Download size={12} />
                Download Approval
              </Button>
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 text-green-700 border-green-300 hover:bg-green-100">
                <ExternalLink size={12} />
                Contact Finance
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    } else if (status === 'pending') {
      return (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200 mb-6">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle>Request Pending</AlertTitle>
          <AlertDescription>
            <p className="mb-3">Your travel request is pending approval. You will be notified when it is reviewed.</p>
            <div className="mt-3 bg-white rounded p-3 border border-amber-100">
              <div className="flex items-center mb-2">
                <div className="h-2.5 w-2.5 bg-amber-400 rounded-full mr-2"></div>
                <p className="text-sm text-amber-700">Submitted for review</p>
              </div>
              <div className="ml-[5px] h-6 border-l border-dashed border-amber-200"></div>
              <div className="flex items-center mb-2">
                <div className="h-2.5 w-2.5 bg-muted rounded-full mr-2"></div>
                <p className="text-sm text-muted-foreground">Manager approval</p>
              </div>
              <div className="ml-[5px] h-6 border-l border-dashed border-muted"></div>
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 bg-muted rounded-full mr-2"></div>
                <p className="text-sm text-muted-foreground">Finance verification</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    } else if (status === 'pending_verification') {
      return (
        <Alert className="bg-purple-50 text-purple-800 border-purple-200 mb-6">
          <Calculator className="h-4 w-4 text-purple-600" />
          <AlertTitle>Under Financial Verification</AlertTitle>
          <AlertDescription>
            <p className="mb-3">Your request has been approved by your manager and is now with Finance for final verification.</p>
            <div className="mt-3 bg-white rounded p-3 border border-purple-100">
              <div className="flex items-center mb-2">
                <div className="h-2.5 w-2.5 bg-green-400 rounded-full mr-2"></div>
                <p className="text-sm text-green-700">Submitted for review ✓</p>
              </div>
              <div className="ml-[5px] h-6 border-l border-dashed border-green-200"></div>
              <div className="flex items-center mb-2">
                <div className="h-2.5 w-2.5 bg-green-400 rounded-full mr-2"></div>
                <p className="text-sm text-green-700">Manager approval ✓</p>
              </div>
              <div className="ml-[5px] h-6 border-l border-dashed border-purple-200"></div>
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 bg-purple-400 rounded-full mr-2"></div>
                <p className="text-sm text-purple-700">Finance verification (in progress)</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push('/employee/dashboard')}
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
      
      {statusAlerts()}
      
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/10">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Travel Request Details
              </CardTitle>
              <CardDescription className="mt-1">
                Request #{displayRequestId} • Submitted on {new Date(request.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
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
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/5 px-6 py-2">
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <User size={16} />
                  <span className="hidden sm:inline">Request Details</span>
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex items-center gap-2">
                  <DollarSign size={16} />
                  <span className="hidden sm:inline">Expenses</span>
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
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-4 bg-muted/5 flex justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {travelDates.start.toLocaleDateString()} - {travelDates.end.toLocaleDateString()}
            <span className="mx-2">•</span>
            <span>{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8"
              asChild
            >
              <Link href="#">
                <Download size={14} />
                Download PDF
              </Link>
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1 h-8"
              onClick={() => router.push('/employee/requests/new')}
            >
              <FileText size={14} />
              New Request
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}