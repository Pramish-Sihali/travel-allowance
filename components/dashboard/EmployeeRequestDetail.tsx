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
  CreditCard
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EmployeeRequestDetailProps {
  requestId: string;
}

export default function EmployeeRequestDetail({ requestId }: EmployeeRequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  
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
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
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
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
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

  return (
    <div className="max-w-4xl mx-auto p-6">
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
          <Badge className={getStatusBadgeClass(request.status)}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader className=" text-primary">
          <CardTitle className="text-xl">Travel Request Details</CardTitle>
          <CardDescription className="text-primary/90">{request.purpose}</CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    Travel Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">From</p>
                      <p className="font-medium">
                        {travelDates.start.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">To</p>
                      <p className="font-medium">
                        {travelDates.end.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Duration</p>
                      <p className="font-medium">{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Submitted On</p>
                      <p className="font-medium">
                        {new Date(request.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Accordion type="single" collapsible defaultValue="expenses">
                <AccordionItem value="expenses" className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <span className="flex items-center gap-2 text-lg font-medium">
                      <DollarSign size={18} className="text-primary" />
                      Expense Details
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    {expenseItems.length === 0 ? (
                      <div className="bg-muted/30 p-6 rounded-lg text-center">
                        <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No expense items found.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Receipts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenseItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
                              <TableCell className="font-medium">
                                ${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </TableCell>
                              <TableCell>
                                {receipts[item.id] && receipts[item.id].length > 0 ? (
                                  <div className="flex flex-col space-y-1">
                                    {receipts[item.id].map((receipt) => (
                                      <TooltipProvider key={receipt.id}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="flex items-center gap-1 h-auto p-1 w-fit"
                                              asChild
                                            >
                                              <Link
                                                href={`/uploads/${receipt.storedFilename}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                                              >
                                                <Paperclip size={14} />
                                                <span className="truncate max-w-[150px]">{receipt.originalFilename}</span>
                                              </Link>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Click to view receipt</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No receipts</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold bg-muted/20">
                            <TableCell colSpan={2} className="text-right">Total</TableCell>
                            <TableCell className="text-primary font-bold">
                              ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {request.status === 'rejected' && (
                <Alert className="bg-red-50 text-red-800 border-red-200">
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
              )}
              
              {request.status === 'approved' && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
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
              )}
              
              {request.status === 'pending' && (
                <Alert className="bg-amber-50 text-amber-800 border-amber-200">
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
              )}
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info size={18} className="text-primary" />
                    Request Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Request ID</p>
                    <p className="font-mono">{displayRequestId}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Request Type</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {request.requestType === 'normal' && <FileText className="h-3.5 w-3.5 text-blue-500" />}
                      {request.requestType === 'advance' && <CreditCard className="h-3.5 w-3.5 text-green-500" />}
                      {request.requestType === 'emergency' && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      <p className="capitalize">{request.requestType}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Total Amount</p>
                    <p className="font-bold text-primary">
                      ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Duration</p>
                    <p>{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Status</p>
                    <p className="capitalize">{request.status}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Expense Items</p>
                    <p>{expenseItems.length}</p>
                  </div>
                  
                  {request.previousOutstandingAdvance !== undefined && request.previousOutstandingAdvance > 0 && (
                    <div>
                      <p className="text-muted-foreground text-sm">Previous Outstanding Advance</p>
                      <p>${request.previousOutstandingAdvance}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3 bg-muted/30">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
                    >
                      <Download size={16} className="text-primary" />
                      <span>Download as PDF</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
                    >
                      <FileText size={16} className="text-primary" />
                      <span>View Attachments</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start gap-2 w-full p-3 rounded-none h-auto"
                    >
                      <MapPin size={16} className="text-primary" />
                      <span>View Itinerary</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}