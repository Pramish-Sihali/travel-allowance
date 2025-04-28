'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TravelRequest } from "@/types";
import { 
  Clock, 
  MessageSquare, 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CreditCard,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface FinanceCommentsListProps {
  requests: TravelRequest[];
  loading: boolean;
}

export default function FinanceCommentsList({ requests, loading }: FinanceCommentsListProps) {
  const router = useRouter();
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  // Toggle expanded state for a request
  const toggleRequestExpanded = (requestId: string) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  // Get display icon for request type
  const getRequestTypeIcon = (requestType: string) => {
    switch (requestType) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'advance':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get badge color based on request type
  const getRequestTypeBadgeClass = (requestType: string) => {
    switch (requestType) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'advance':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle submitting expenses for the request
  const handleSubmitExpenses = (request: TravelRequest) => {
    if (request.requestType === 'in-valley') {
      router.push(`/employee/requests/in-valley?id=${request.id}&expenses=true`);
    } else {
      // This handles both normal and emergency/advance requests
      router.push(`/employee/requests/new?id=${request.id}&expenses=true`);
    }
  };

  // Handle viewing detailed request
  const handleViewRequest = (request: TravelRequest) => {
    if (request.requestType === 'in-valley') {
      router.push(`/employee/requests/in-valley/${request.id}`);
    } else {
      router.push(`/employee/requests/${request.id}`);
    }
  };

  // Get formatted status text
  const getFormattedStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'travel_approved':
        return 'Ready for Expenses';
      case 'pending_verification':
        return 'Under Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };

  // Early return for loading state
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading finance comments...</p>
      </div>
    );
  }

  // Early return for empty state
  if (requests.length === 0) {
    return (
      <div className="py-12 text-center bg-muted/10 rounded-md border mt-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-2">No Finance Comments</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          No emergency or advance requests with finance comments at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <AlertTitle>Finance Comments Available</AlertTitle>
        <AlertDescription>
          The finance team has provided comments on your emergency or advance requests. 
          You may need to take action based on these comments.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        {requests.map(request => (
          <Collapsible 
            key={request.id}
            open={expandedRequests[request.id]} 
            onOpenChange={() => toggleRequestExpanded(request.id)}
            className="border rounded-md overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/10">
                <div className="flex items-center gap-3">
                  {getRequestTypeIcon(request.requestType || 'normal')}
                  <div>
                    <h3 className="font-medium">{request.purpose}</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(request.travelDateFrom)}
                        {request.travelDateFrom !== request.travelDateTo && 
                          ` - ${formatDate(request.travelDateTo)}`}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRequestTypeBadgeClass(request.requestType || 'normal')}>
                    {request.requestType === 'emergency' ? 'Emergency' : 'Advance'} Request
                  </Badge>
                  {expandedRequests[request.id] ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 border-t">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
  <div className="flex items-start gap-2">
    <MessageSquare className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="font-medium text-amber-800 mb-1">Finance Comment</h4>
      <p className="text-amber-700 whitespace-pre-line">
        {request.financeComments || request.checkerComments}
      </p>
    </div>
  </div>
</div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <p className="text-sm mb-1">Amount: <span className="font-medium">
                      Nrs. {request.totalAmount?.toLocaleString() || 'Pending'}
                    </span></p>
                    <p className="text-sm">Status: <span className="font-medium">
                      {getFormattedStatus(request.status)}
                    </span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRequest(request);
                      }}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Details
                    </Button>
                    
                    {/* Show "Add Expenses" button for any emergency/advance request with finance comments */}
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubmitExpenses(request);
                      }}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Expenses
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}