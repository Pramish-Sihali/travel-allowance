import { Dispatch, SetStateAction } from 'react';
import { TravelRequest } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  MessageCircle,
  CheckCheck,
  Check,
  ThumbsUp, 
  ThumbsDown, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface RequestApprovalTabProps {
  request: TravelRequest;
  approvalComment: string;
  setApprovalComment: Dispatch<SetStateAction<string>>;
  handleApproveReject: (status: 'approved' | 'rejected') => Promise<void>;
  isSubmitting: boolean;
  router: any; // Use any type to avoid import errors
}

export default function RequestApprovalTab({ 
  request, 
  approvalComment, 
  setApprovalComment, 
  handleApproveReject, 
  isSubmitting,
  router
}: RequestApprovalTabProps) {
  return (
    <div className="p-6 space-y-6">
      {request.status !== 'pending' ? (
        <Alert className={request.status === 'approved' 
          ? 'bg-green-50 text-green-800 border-green-200' 
          : 'bg-red-50 text-red-800 border-red-200'
        }>
          {request.status === 'approved' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle>{request.status === 'approved' ? 'Request Approved' : 'Request Rejected'}</AlertTitle>
          <AlertDescription>
            This request has already been {request.status}.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" />
              Approval Action
            </CardTitle>
            <CardDescription>
              Review the request carefully before making a decision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Comments (Optional)</label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add any comments or notes regarding your decision..."
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {approvalComment.length} characters
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/approver/dashboard')}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleApproveReject('rejected')}
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
                    <ThumbsDown size={16} />
                    Reject Request
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleApproveReject('approved')}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ThumbsUp size={16} />
                    Approve Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCheck size={16} className="text-primary" />
            Approval Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-primary">
                <Check size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Verify Request Details</p>
                <p className="text-muted-foreground text-sm">
                  Confirm that the travel purpose aligns with business needs and the employee's role.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 text-primary">
                <Check size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Check Expense Amounts</p>
                <p className="text-muted-foreground text-sm">
                  Ensure that all expenses are reasonable and adhere to company policy limits.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 text-primary">
                <Check size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Review Supporting Documents</p>
                <p className="text-muted-foreground text-sm">
                  Verify that all required receipts and supporting documents have been provided.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 text-primary">
                <Check size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Check Outstanding Advances</p>
                <p className="text-muted-foreground text-sm">
                  Review any previous outstanding advances and ensure they won't impact this request.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 text-primary">
                <Check size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Consider Budget Impact</p>
                <p className="text-muted-foreground text-sm">
                  Assess how this travel expense fits into the department's overall budget allocation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}