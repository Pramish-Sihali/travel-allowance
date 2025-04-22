'use client';

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  CheckCircle2,
  Loader2
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
  approverId?: string;
  previousOutstandingAdvance?: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: string;
  project_id: string;
  amount: number;
  fiscal_year: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ApproverInfo {
  id: string;
  name: string;
  email: string;
}

interface CheckerInValleyDetailProps {
  requestId: string;
}

export default function CheckerInValleyDetail({ requestId }: CheckerInValleyDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<ValleyRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ValleyExpense[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  
  // New state for projects and budgets
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [includeOutstandingBalance, setIncludeOutstandingBalance] = useState(true);
  
  // State for approver information
  const [approver, setApprover] = useState<ApproverInfo | null>(null);
  
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        // Fetch request
        const requestResponse = await fetch(`/api/valley-requests/${requestId}`);
        if (!requestResponse.ok) {
          throw new Error('Failed to fetch request details');
        }
        const requestData = await requestResponse.json();
        setRequest(requestData);
        
        // Load previous comments if they exist
        if (requestData.checkerComments) {
          setComments(requestData.checkerComments);
        }
        
        // Fetch approver information if approverId exists
        if (requestData.approverId) {
          try {
            const approverResponse = await fetch(`/api/user/${requestData.approverId}/profile`);
            if (approverResponse.ok) {
              const approverData = await approverResponse.json();
              setApprover({
                id: requestData.approverId,
                name: approverData.name || 'Unknown Approver',
                email: approverData.email || ''
              });
            }
          } catch (error) {
            console.error('Error fetching approver details:', error);
          }
        }
        
        // Fetch expense items
        const expensesResponse = await fetch(`/api/valley-expenses?requestId=${requestId}`);
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
    fetchProjects();
  }, [requestId]);
  
  // Fetch projects
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      
      // Fetch projects
      const projectsResponse = await fetch('/api/projects?includeInactive=true', {
        cache: 'no-store',
      });
      
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await projectsResponse.json();
      console.log(`Fetched ${projectsData.length} projects`);
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
        
        // Fetch budgets for this project 
        await fetchBudgets(projectsData[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };
  
  // Fetch budgets
  const fetchBudgets = async (projectId?: string) => {
    try {
      setBudgetsLoading(true);
      
      // Construct the URL with optional project_id filter and cache-busting timestamp
      const timestamp = new Date().getTime();
      let url = `/api/budgets?t=${timestamp}`;
      if (projectId) {
        url += `&project_id=${projectId}`;
      }
      
      console.log('Fetching budgets from:', url);
      const budgetsResponse = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!budgetsResponse.ok) {
        console.error('Budget fetch error status:', budgetsResponse.status);
        const errorText = await budgetsResponse.text();
        console.error('Budget fetch error response:', errorText);
        throw new Error(`Failed to fetch budgets: ${budgetsResponse.status} ${errorText}`);
      }
      
      const budgetsData = await budgetsResponse.json();
      console.log(`Fetched ${budgetsData.length} budgets`);
      setBudgets(budgetsData);
      
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setBudgetsLoading(false);
    }
  };
  
  // When selected project changes, fetch its budget
  useEffect(() => {
    if (selectedProjectId) {
      fetchBudgets(selectedProjectId);
    }
  }, [selectedProjectId]);
  
  const updateProjectBudget = async (projectId: string, amount: number) => {
    try {
      // Find the current budget for the project
      const currentBudget = budgets.find(budget => budget.project_id === projectId);
      
      if (!currentBudget) {
        console.error('No budget found for project:', projectId);
        return false;
      }
      
      // Calculate total expense amount based on includeOutstandingBalance flag
      const expenseAmount = includeOutstandingBalance 
        ? amount + (request?.previousOutstandingAdvance || 0)
        : amount;
      
      // Calculate new amount (deduct the expense amount)
      const newAmount = Math.max(0, currentBudget.amount - expenseAmount);
      
      console.log('Updating budget:', currentBudget.id, 'New amount:', newAmount);
      
      // Update the budget using the public API
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentBudget.id,
          amount: newAmount,
        }),
      });
      
      if (!response.ok) {
        console.error('Budget update error status:', response.status);
        const errorData = await response.json();
        console.error('Budget update error:', errorData);
        throw new Error('Failed to update budget');
      }
      
      console.log(`Successfully updated budget for project ${projectId}. New amount: ${newAmount}`);
      return true;
    } catch (error) {
      console.error('Error updating project budget:', error);
      return false;
    }
  };
  
  // Helper functions for project, budget, and status
  const getSelectedProjectBudget = () => {
    if (!selectedProjectId) return null;
    return budgets.find(budget => budget.project_id === selectedProjectId);
  };
  
  const getSelectedProjectName = () => {
    if (!selectedProjectId) return "Select a project";
    const project = projects.find(p => p.id === selectedProjectId);
    return project ? project.name : "Unknown Project";
  };
  
  const isProjectActive = () => {
    if (!selectedProjectId) return false;
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.active || false;
  };
  
  const hasEnoughBudget = () => {
    const selectedBudget = getSelectedProjectBudget();
    if (!selectedBudget || !request) return false;
    
    const totalToCheck = includeOutstandingBalance 
      ? request.totalAmount + (request.previousOutstandingAdvance || 0)
      : request.totalAmount;
      
    return selectedBudget.amount >= totalToCheck;
  };
  
  const calculateBudgetUsagePercentage = () => {
    const selectedBudget = getSelectedProjectBudget();
    if (!selectedBudget || !request || selectedBudget.amount === 0) return 0;
    
    const totalToCheck = includeOutstandingBalance 
      ? request.totalAmount + (request.previousOutstandingAdvance || 0)
      : request.totalAmount;
      
    const percentage = (totalToCheck / selectedBudget.amount) * 100;
    return Math.min(100, percentage); // Cap at 100%
  };
  
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
          role: 'checker'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request status');
      }
      
      const updatedRequest = await response.json();
      setRequest(updatedRequest);
      
      // If approved, update the project budget
      if (newStatus === 'approved' && selectedProjectId) {
        const budgetUpdated = await updateProjectBudget(
          selectedProjectId, 
          updatedRequest.totalAmount || 0
        );
        
        if (!budgetUpdated) {
          setStatusMessage({
            type: 'error',
            message: 'The request was approved but there was an issue updating the project budget. Please check the budget manually.'
          });
          return;
        }
      }
      
      // Show success message
      setStatusMessage({
        type: 'success',
        message: `Request has been ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully. Redirecting...`
      });
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/checker/dashboard');
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
          <CardFooter className="flex justify-center">
            <Button
              onClick={() => router.push('/checker/dashboard')}
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
  const canTakeAction = status === 'pending_verification';
  
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
          
          {/* Approver information if available */}
          {approver && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h3 className="text-md font-medium flex items-center gap-2 text-blue-800 mb-2">
                <User className="h-4 w-4" />
                Approved By
              </h3>
              <p className="text-blue-700">{approver.name}</p>
              {approver.email && <p className="text-sm text-blue-600">{approver.email}</p>}
            </div>
          )}
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
              
              {(request.previousOutstandingAdvance || 0) > 0 && (
                <div className="py-2 grid grid-cols-2">
                  <span className="text-muted-foreground">Previous Outstanding:</span>
                  <span className="font-medium text-right text-amber-600">
                    Nrs. {(request.previousOutstandingAdvance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {request.approverComments && (
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mt-6">
                <FileText className="h-5 w-5 text-primary" />
                Approver Comments
              </h3>
              <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                <p className="whitespace-pre-line text-purple-800">{request.approverComments}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="#expenses" onClick={() => setActiveTab('expenses')} className="flex items-center gap-1">
                <FileText size={16} />
                View Expenses
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
        <a  // This opening <a> tag was missing
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
  
  // Render the verification tab content
  const renderActionTab = () => (
    <div className="p-6 space-y-6">
      {statusMessage && (
        <Alert className={cn(
          statusMessage.type === 'success' ? "bg-green-50 text-green-800 border-green-200" :
          "bg-red-50 text-red-800 border-red-200"
        )}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle>{statusMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{statusMessage.message}</AlertDescription>
        </Alert>
      )}
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="text-lg font-medium flex items-center gap-2 text-yellow-800">
          <Info className="h-5 w-5 text-yellow-600" />
          Financial Verification
        </h3>
        <p className="mt-2 text-yellow-700">
          Please verify the expenses in this in-valley reimbursement request. 
          Check all receipts and ensure they comply with company policy.
        </p>
      </div>
      
      {request.approverComments && (
        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertTitle>Approver Comments</AlertTitle>
          <AlertDescription>
            {request.approverComments}
          </AlertDescription>
        </Alert>
      )}
      
      {(request.previousOutstandingAdvance || 0) > 0 && (
        <div className="flex items-center space-x-2 mb-4 bg-amber-50 p-3 rounded-md border border-amber-200">
          <input
            type="checkbox"
            id="includeOutstandingBalance"
            checked={includeOutstandingBalance}
            onChange={(e) => setIncludeOutstandingBalance(e.target.checked)}
            className="h-4 w-4 rounded border-amber-300 text-primary focus:ring-primary"
          />
          <label htmlFor="includeOutstandingBalance" className="text-sm text-amber-800">
            Include previous outstanding balance of Nrs.{(request.previousOutstandingAdvance || 0).toLocaleString()} in budget calculation
          </label>
        </div>
      )}
      
      <div className="bg-muted/10 p-4 rounded-md border mb-4">
        <h3 className="text-lg font-medium mb-4">Project Budget Allocation</h3>
        
        {projectsLoading ? (
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
        ) : projects.length === 0 ? (
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            No projects found. Please add projects in the admin settings.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Select Project</label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project">{getSelectedProjectName()}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} {!project.active && '(Inactive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedProjectId && !isProjectActive() && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    This project is inactive. Please select an active project.
                  </div>
                )}
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium">Project Budget</label>
                {budgetsLoading ? (
                  <div className="h-24 w-full bg-gray-200 animate-pulse rounded"></div>
                ) : getSelectedProjectBudget() ? (
                  <div className="border rounded-md p-3 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Current Budget:</span>
                      <span className="text-sm font-bold">
                        Nrs.{getSelectedProjectBudget()?.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Request Amount:</span>
                      <span className="text-sm font-bold text-purple-700">
                        Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    
                    {(request.previousOutstandingAdvance || 0) > 0 && includeOutstandingBalance && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Including Balance:</span>
                        <span className="text-sm font-bold text-amber-700">
                          Nrs.{(request.totalAmount + (request.previousOutstandingAdvance || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-3 mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Usage</span>
                        <span className={hasEnoughBudget() ? 'text-green-700' : 'text-red-700'}>
                          {calculateBudgetUsagePercentage().toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={calculateBudgetUsagePercentage()} 
                        className={hasEnoughBudget() ? 'bg-green-100' : 'bg-red-100'}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Remaining After Approval:</span>
                      <span className={`text-sm font-bold ${hasEnoughBudget() ? 'text-green-700' : 'text-red-700'}`}>
                        Nrs.{Math.max(0, getSelectedProjectBudget()!.amount - (includeOutstandingBalance ? (request.totalAmount + (request.previousOutstandingAdvance || 0)) : request.totalAmount)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    
                    {!hasEnoughBudget() && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Insufficient budget! Select a different project or update budget in settings.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 border rounded-md bg-gray-50 text-muted-foreground">
                    No budget found for selected project
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-muted/10 p-4 rounded-md border">
        <h3 className="text-lg font-medium mb-4">Verification Comments</h3>
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
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ThumbsDown className="h-5 w-5" />
              Reject Request
            </>
          )}
        </Button>
        
        <Button
          variant="default"
          size="lg"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => handleStatusUpdate('approved')}
          disabled={isSubmitting || !canTakeAction || !selectedProjectId || !hasEnoughBudget() || !isProjectActive()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Approve Request
            </>
          )}
        </Button>
      </div>
      
      {!canTakeAction && (
        <Alert className="mt-4 bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>Action Not Available</AlertTitle>
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
          onClick={() => router.push('/checker/dashboard')}
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
                  <span className="hidden sm:inline">Verification</span>
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
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {request.employeeName}
            </span>
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