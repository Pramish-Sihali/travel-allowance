// components/dashboard/common/ActionPanel.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  MessageCircle,
  ArrowLeft,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Info
} from 'lucide-react';
import { TravelRequest } from '@/types';
import { formatCurrency } from '../utils/formatters';
import { cn } from "@/lib/utils";

export interface ActionInfo {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'custom';
  customClass?: string;
}

interface ActionPanelProps {
  request: TravelRequest;
  comments: string;
  setComments: React.Dispatch<React.SetStateAction<string>>;
  onAction: (action: string) => Promise<void>;
  isSubmitting: boolean;
  onBack: () => void;
  title?: string;
  description?: string;
  statusMessage?: {
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null;
  actions: ActionInfo[];
  showRequestDetails?: boolean;
  showCurrentStatus?: boolean;
  commentsLabel?: string;
  commentsPlaceholder?: string;
  className?: string;
  children?: React.ReactNode;
  disableActions?: boolean;
  disableReason?: string;
}

/**
 * A reusable action panel component for approval/verification screens
 */
const ActionPanel: React.FC<ActionPanelProps> = ({
  request,
  comments,
  setComments,
  onAction,
  isSubmitting,
  onBack,
  title = "Action Required",
  description,
  statusMessage,
  actions,
  showRequestDetails = true,
  showCurrentStatus = true,
  commentsLabel = "Comments",
  commentsPlaceholder = "Add any comments or notes regarding your decision...",
  className,
  children,
  disableActions = false,
  disableReason
}) => {
  // Get status alert styling
  const getStatusAlertClass = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  // Get status icon
  const getStatusIcon = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  // Show current status if already processed
  const renderStatusAlert = () => {
    if (!showCurrentStatus || request.status === 'pending' || request.status === 'pending_verification') {
      return null;
    }

    const isApproved = request.status === 'approved';
    const alertClass = isApproved ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200';
    const alertIcon = isApproved ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />;
    const alertTitle = isApproved ? 'Request Approved' : 'Request Rejected';
    const alertDescription = isApproved 
      ? 'This request has been approved and processed.' 
      : 'This request has been rejected.';

    return (
      <Alert className={alertClass}>
        {alertIcon}
        <AlertTitle>{alertTitle}</AlertTitle>
        <AlertDescription>{alertDescription}</AlertDescription>
        
        {(request.approverComments || request.checkerComments) && (
          <div className="mt-2 p-3 bg-white/50 rounded-md border border-current/20">
            <p className="font-medium text-sm">Comments:</p>
            <p className="text-sm mt-1">{request.approverComments || request.checkerComments}</p>
          </div>
        )}
      </Alert>
    );
  };

  // Calculate combined total (including previous outstanding advance)
  const calculateCombinedTotal = () => {
    return request.totalAmount + (request.previousOutstandingAdvance || 0);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Status message if provided */}
      {statusMessage && (
        <Alert className={getStatusAlertClass(statusMessage.type)}>
          {getStatusIcon(statusMessage.type)}
          {statusMessage.title && <AlertTitle>{statusMessage.title}</AlertTitle>}
          <AlertDescription>{statusMessage.message}</AlertDescription>
        </Alert>
      )}
      
      {/* Current status alert if request is already processed */}
      {renderStatusAlert()}
      
      {/* Main action panel if request is pending */}
      {(request.status === 'pending' || request.status === 'pending_verification') && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-primary" />
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          
          {description && (
            <p className="text-muted-foreground mb-4">{description}</p>
          )}
          
          {/* Request details summary */}
          {showRequestDetails && (
            <div className="mb-6 bg-muted/10 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Employee:</span>
                    <span>{request.employeeName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Department:</span>
                    <span>{request.department}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Project:</span>
                    <span>{request.project === 'other' ? request.projectOther : request.project?.replace('-', ' ')}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {request.requestType === 'in-valley' ? 'Expense Date:' : 'Travel Period:'}
                    </span>
                    <span>
                      {request.requestType === 'in-valley' ? (
                        new Date(request.expenseDate || request.travelDateFrom).toLocaleDateString()
                      ) : (
                        `${new Date(request.travelDateFrom).toLocaleDateString()} - ${new Date(request.travelDateTo).toLocaleDateString()}`
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Purpose:</span>
                    <span>{request.purpose}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Request Amount:</span>
                    <Badge className="bg-primary/10 text-primary border-0 font-medium">
                      {formatCurrency(request.totalAmount)}
                    </Badge>
                  </div>
                  
                  {request.previousOutstandingAdvance > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-amber-700">Previous Outstanding:</span>
                        <Badge className="bg-amber-100 text-amber-800 border-0 font-medium">
                          {formatCurrency(request.previousOutstandingAdvance)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Combined Total:</span>
                        <Badge className="bg-primary/20 text-primary border-0 font-bold">
                          {formatCurrency(calculateCombinedTotal())}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Comments textarea */}
          <div className="mb-6">
            <label className="block mb-2 font-medium">{commentsLabel}</label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={commentsPlaceholder}
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Your comments will be visible to the requester and other stakeholders
              </p>
              <p className="text-xs text-muted-foreground">
                {comments.length} characters
              </p>
            </div>
          </div>
          
          {/* Additional content (if provided) */}
          {children}
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            
            {actions.map(action => (
              <Button
                key={action.key}
                variant={action.variant || 'default'}
                onClick={() => onAction(action.key)}
                disabled={isSubmitting || disableActions}
                className={cn(
                  "flex items-center gap-2",
                  action.customClass,
                  action.variant === 'custom' && action.key === 'approve' && "bg-green-600 hover:bg-green-700 text-white",
                  action.variant === 'custom' && action.key === 'reject' && "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {React.createElement(action.icon, { size: 16 })}
                    {action.label}
                  </>
                )}
              </Button>
            ))}
          </div>
          
          {/* Disable reason message if actions are disabled */}
          {disableActions && disableReason && (
            <Alert className="mt-4 bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle>Action Not Available</AlertTitle>
              <AlertDescription>{disableReason}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionPanel;