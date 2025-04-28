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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Briefcase,
  Users,
  Mail,
  Send
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Import the tab content components for reuse
import RequestDetailsTab from '@/components/dashboard/RequestDetailsTab';
import RequestExpensesTab from '@/components/dashboard/RequestExpensesTab';

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

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  department?: string;
}

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
  
  // Finance comment state variables
  const [financeComment, setFinanceComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [financeCommentMessage, setFinanceCommentMessage] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  
  // State for projects and budgets
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [includeOutstandingBalance, setIncludeOutstandingBalance] = useState(true);
  
  // State for approver and group members
  const [approver, setApprover] = useState<ApproverInfo | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
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
        
        // Load previous comments if they exist
        if (requestData.checkerComments) {
          setVerificationComment(requestData.checkerComments);
        }
        
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
        
        // Fetch group members if it's a group travel
        if (requestData.isGroupTravel && requestData.groupMembers && requestData.groupMembers.length > 0) {
          try {
            // Convert array to comma-separated string for URL params
            const memberIds = requestData.groupMembers.join(',');
            const groupMembersResponse = await fetch(`/api/users/by-ids?ids=${memberIds}`);
            
            if (groupMembersResponse.ok) {
              const membersData = await groupMembersResponse.json();
              setGroupMembers(membersData);
            }
          } catch (error) {
            console.error('Error fetching group members:', error);
          }
        }
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
      console.log('Projects data:', projectsData);
      setProjects(projectsData);
      
      // Get request data to find matching project
      if (request) {
        // Try to find project by name from the request
        const projectName = request.project === 'other' ? request.projectOther : request.project;
        if (projectName) {
          // Look for a matching project in the projects list
          const matchingProject = projectsData.find((p: { name: string; id: string; }) => 
            p.name.toLowerCase() === projectName.toLowerCase() ||
            p.id === projectName // In case project is stored as ID
          );
          
          if (matchingProject) {
            console.log('Found matching project:', matchingProject.name);
            setSelectedProjectId(matchingProject.id);
          } else if (projectsData.length > 0) {
            // Fallback to first project if no match found
            setSelectedProjectId(projectsData[0].id);
          }
        } else if (projectsData.length > 0) {
          // If no project in request, default to first
          setSelectedProjectId(projectsData[0].id);
        }
      } else if (projectsData.length > 0) {
        // If request not yet loaded, just select first project
        setSelectedProjectId(projectsData[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };
  
  // Re-run project matching when request data is loaded
  useEffect(() => {
    if (request && projects.length > 0) {
      const projectName = request.project === 'other' ? request.projectOther : request.project;
      if (projectName) {
        const matchingProject = projects.find(p => 
          p.name.toLowerCase() === projectName.toLowerCase() ||
          p.id === projectName
        );
        
        if (matchingProject) {
          console.log('Setting project to match request:', matchingProject.name);
          setSelectedProjectId(matchingProject.id);
        }
      }
    }
  }, [request, projects]);
  
  // Fetch budgets, optionally for a specific project
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
      console.log('Budgets data:', budgetsData);
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
  
  // Update budget after approval
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

  // Handle sending finance comment
  const handleSendFinanceComment = async () => {
    if (!request || !financeComment.trim()) return;
    
    setIsSubmittingComment(true);
    setFinanceCommentMessage(null);
    
    try {
      const endpoint = request.requestType === 'in-valley' 
        ? `/api/valley-requests/${requestId}/finance-comment` 
        : `/api/requests/${requestId}/finance-comment`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: financeComment
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send finance comment');
      }
      
      const data = await response.json();
      
      // Show success message
      setFinanceCommentMessage({
        type: 'success',
        message: 'Finance comment sent successfully. The employee has been notified.'
      });
      
      // Clear the comment field
      setFinanceComment('');
      
    } catch (error) {
      console.error('Error sending finance comment:', error);
      setFinanceCommentMessage({
        type: 'error',
        message: 'Failed to send finance comment. Please try again.'
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Render finance comment section
  const renderFinanceCommentSection = () => (
    <Card className="shadow-sm border-l-4 border-l-amber-400 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-5 w-5 text-amber-500" />
          Send Finance Comment to Employee
        </CardTitle>
        <CardDescription>
          Send a message about financial matters without changing the request status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {financeCommentMessage && (
          <Alert className={cn(
            "mb-4",
            financeCommentMessage.type === 'success' ? "bg-green-50 text-green-800 border-green-200" : 
            "bg-red-50 text-red-800 border-red-200"
          )}>
            {financeCommentMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>{financeCommentMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{financeCommentMessage.message}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div>
            <Textarea
              value={financeComment}
              onChange={(e) => setFinanceComment(e.target.value)}
              placeholder="Add a finance-related comment for the employee (e.g., 'Funds will be released tomorrow')"
              className="min-h-[100px] resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1">
              This comment will be visible to the employee and they will be notified.
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleSendFinanceComment}
              disabled={isSubmittingComment || !financeComment.trim()}
              className="flex items-center gap-2"
            >
              {isSubmittingComment ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleVerification = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // First, update the request status
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
      
      // If approved, update the project budget
      if (status === 'approved' && selectedProjectId) {
        const budgetUpdated = await updateProjectBudget(
          selectedProjectId, 
          updatedRequest.totalAmount || 0
        );
        
        if (!budgetUpdated) {
          setErrorMessage(`The request was approved but there was an issue updating the project budget. Please check the budget manually.`);
          return;
        }
      }
      
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
  
  // Find budget for selected project
  const getSelectedProjectBudget = () => {
    if (!selectedProjectId) return null;
    
    const projectBudget = budgets.find(budget => budget.project_id === selectedProjectId);
    return projectBudget;
  };
  
  const selectedBudget = getSelectedProjectBudget();

  // Get selected project name
  const getSelectedProjectName = () => {
    if (!selectedProjectId) return "Select a project";
    const project = projects.find(p => p.id === selectedProjectId);
    return project ? project.name : "Unknown Project";
  };

  // Check if the project has enough budget for the request
  const hasEnoughBudget = () => {
    if (!selectedBudget || !request) return false;
    
    const totalToCheck = includeOutstandingBalance 
      ? request.totalAmount + (request.previousOutstandingAdvance || 0)
      : request.totalAmount;
      
    return selectedBudget.amount >= totalToCheck;
  };
  // Check if project is active
  const isProjectActive = () => {
    if (!selectedProjectId) return false;
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.active || false;
  };
  
  // Calculate budget usage percentage
  const calculateBudgetUsagePercentage = () => {
    if (!selectedBudget || !request || selectedBudget.amount === 0) return 0;
    
    const totalToCheck = includeOutstandingBalance 
      ? request.totalAmount + (request.previousOutstandingAdvance || 0)
      : request.totalAmount;
      
    const percentage = (totalToCheck / selectedBudget.amount) * 100;
    return Math.min(100, percentage);
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
  requestType === 'emergency' ? 'bg-red-100 text-red-800 border-red-200' :
  requestType === 'in-valley' ? 'bg-purple-100 text-purple-800 border-purple-200' :
  requestType === 'group' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
  'bg-gray-100 text-gray-800 border-gray-200'
)}>
  {requestType === 'normal' && <FileText className="h-3.5 w-3.5" />}
  {requestType === 'advance' && <CreditCard className="h-3.5 w-3.5" />}
  {requestType === 'emergency' && <AlertTriangle className="h-3.5 w-3.5" />}
  {requestType === 'in-valley' && <MapPin className="h-3.5 w-3.5" />} 
  {requestType === 'group' && <Users className="h-3.5 w-3.5" />}
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
              <div className="p-6 space-y-6">
                <RequestDetailsTab request={request} travelDates={travelDates} />
                
                {/* Display approver information if available */}
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
                
                {/* Display group members if it's a group travel */}
                {request.isGroupTravel && groupMembers.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                    <h3 className="text-md font-medium flex items-center gap-2 text-purple-800 mb-2">
                      <Users className="h-4 w-4" />
                      Group Travel Members ({groupMembers.length})
                    </h3>
                    <ul className="space-y-2 mt-2">
                      {groupMembers.map(member => (
                        <li key={member.id} className="flex items-center gap-2">
                          <User className="h-3 w-3 text-purple-600" />
                          <span className="text-purple-700">{member.name}</span>
                          {member.department && (
                            <span className="text-xs text-purple-600">({member.department})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    
                    {request.groupDescription && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-sm text-purple-700">{request.groupDescription}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

            {request.requestType === 'emergency' && (
  <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
    <AlertTriangle className="h-4 w-4 text-red-600" />
    <AlertTitle>
      <span className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Emergency Request
      </span>
    </AlertTitle>
    <AlertDescription>
      <div className="mt-2">
        <p className="font-medium text-sm">Emergency Reason:</p>
        <p className="mb-2">
          {request.emergencyReason === 'urgent-meeting' ? 'Urgent Meeting' :
           request.emergencyReason === 'crisis-response' ? 'Crisis Response' :
           request.emergencyReason === 'time-sensitive' ? 'Time-Sensitive Opportunity' :
           request.emergencyReason === 'medical' ? 'Medical Emergency' :
           request.emergencyReason === 'other' ? (request.emergencyReasonOther || 'Other') :
           request.emergencyReason || 'Not specified'}
        </p>
        
        <p className="font-medium text-sm">Emergency Justification:</p>
        <p className="text-sm whitespace-pre-line">{request.emergencyJustification}</p>
      </div>
      <div className="mt-3 p-2 bg-red-100 rounded text-sm">
        <p className="font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Urgent Action Required
        </p>
        <p>This request has been flagged as urgent and requires expedited processing.</p>
      </div>
    </AlertDescription>
  </Alert>
)}

{/* Special Alert for Advance Requests */}
{request.requestType === 'advance' && (
  <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
    <DollarSign className="h-4 w-4 text-amber-600" />
    <AlertTitle>
      <span className="flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        Advance Payment Request
      </span>
    </AlertTitle>
    <AlertDescription>
      <div className="mt-2">
        <p className="font-medium text-sm">Estimated Amount:</p>
        <p className="mb-2">Nrs. {parseFloat(request.estimatedAmount || '0').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        
        <p className="font-medium text-sm">Advance Notes:</p>
        <p className="text-sm whitespace-pre-line">{request.advanceNotes}</p>
      </div>
      <div className="mt-3 p-2 bg-amber-100 rounded text-sm">
        <p className="font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Advance Payment
        </p>
        <p>This employee requires advance payment before travel. Please prioritize processing.</p>
      </div>
    </AlertDescription>
  </Alert>
)}

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
                  {/* Finance Comment Section */}
                  {request.status === 'pending_verification' && renderFinanceCommentSection()}
                
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
                          {(request.previousOutstandingAdvance || 0) > 0 && (
                            <Badge className="bg-amber-100 text-amber-800 border-0 font-bold text-xs">
                              <AlertTriangle size={10} className="mr-1" />
                              Previous Balance: Nrs.{(request.previousOutstandingAdvance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Badge>
                          )}
                          {(request.previousOutstandingAdvance || 0) > 0  && includeOutstandingBalance && (
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
                        
                        {/* Project & Budget Selection - 2 column layout */}
                        <div className="pt-4 border-t">
                          <label className="block mb-2 text-base font-medium">Select Project for Budget Allocation</label>
                          {projectsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Skeleton className="h-10 w-full" />
                              <Skeleton className="h-10 w-full" />
                            </div>
                          ) : projects.length === 0 ? (
                            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <AlertTitle>No Projects Available</AlertTitle>
                              <AlertDescription>
                                No projects found. Please add projects in the admin settings before approving requests.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Project Selection Column */}
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium">Project</h4>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    {projects.length} Projects
                                  </Badge>
                                </div>
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
                              
                              {/* Budget Display Column */}
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium">Budget</h4>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Available Funds
                                  </Badge>
                                </div>
                                
                                {budgetsLoading ? (
                                  <Skeleton className="h-32 w-full" />
                                ) : selectedProjectId && selectedBudget ? (
                                  <div className="border rounded-md p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium">Current Budget:</span>
                                      <span className="text-sm font-bold">
                                        Nrs.{selectedBudget.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium">Request Amount:</span>
                                      <span className="text-sm font-bold text-purple-700">
                                        Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </span>
                                    </div>
                                    
                                    {(request.previousOutstandingAdvance || 0) > 0  && includeOutstandingBalance && (
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">Including Balance:</span>
                                        <span className="text-sm font-bold text-amber-700">
                                          Nrs.{calculateCombinedTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                                        indicatorClassName={hasEnoughBudget() ? 'bg-green-500' : 'bg-red-500'}
                                      />
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t">
                                      <span className="text-sm font-medium">Remaining After Approval:</span>
                                      <span className={`text-sm font-bold ${hasEnoughBudget() ? 'text-green-700' : 'text-red-700'}`}>
                                        Nrs.{Math.max(0, selectedBudget.amount - (includeOutstandingBalance ? calculateCombinedTotal() : request.totalAmount)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </span>
                                    </div>
                                    
                                    {!hasEnoughBudget() && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                                        Insufficient budget! Select a different project or update budget in settings.
                                      </div>
                                    )}
                                  </div>
                                ) : selectedProjectId ? (
                                  <div className="border rounded-md p-4 bg-amber-50 text-center">
                                    <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                                    <p className="text-sm font-medium text-amber-800">No budget found for this project</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                      Please select a different project or add a budget in admin settings
                                    </p>
                                  </div>
                                ) : (
                                  <div className="border rounded-md p-4 bg-gray-50 text-center text-muted-foreground text-sm">
                                    <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
                                    Select a project to view budget
                                  </div>
                                )}
                                
                                <div className="text-xs text-muted-foreground">
                                  Project budgets are managed in the admin settings. Current fiscal year: {new Date().getFullYear()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
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
                  
                  <Card className="shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Request Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
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
                        </div>
                        
                        <div className="space-y-3">
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
                          
                          {approver && (
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-purple-500" />
                              <span className="text-sm font-medium">Approved By:</span>
                              <span className="text-sm">{approver.name}</span>
                            </div>
                          )}
                          
                          <div className="space-y-2 mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">Financial Verification Is Final</p>
                                <p className="text-xs text-amber-700">
                                  Once approved, funds will be released to the employee and project budget will be updated. Make sure all documentation is complete.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
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
                      disabled={isSubmitting || !selectedProjectId || !hasEnoughBudget() || !isProjectActive()}
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