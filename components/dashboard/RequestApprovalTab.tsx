// components/dashboard/RequestApprovalTab.tsx

import { Dispatch, SetStateAction } from 'react';
import { TravelRequest } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  MessageCircle,
  CheckCheck,
  Check,
  ThumbsUp, 
  ThumbsDown, 
  ArrowLeft,
  Loader2, 
  Calculator,
  FileText,
  ClipboardCheck,
  ScrollText,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Building,
  Briefcase
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
  // Calculate combined total (including previous outstanding advance)
  const calculateCombinedTotal = () => {
    return request.totalAmount + (request.previousOutstandingAdvance || 0);
  };

  return (
    <div className="p-6 space-y-6">
      {request.status !== 'pending' ? (
        <Alert className={
          request.status === 'approved' || request.status === 'pending_verification' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }>
          {request.status === 'approved' || request.status === 'pending_verification' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle>
            {request.status === 'pending_verification' 
              ? 'Request Approved - Pending Financial Verification' 
              : request.status === 'approved' 
                ? 'Request Fully Approved'
                : 'Request Rejected'}
          </AlertTitle>
          <AlertDescription>
            {request.status === 'pending_verification' 
              ? 'You have approved this request. It is now awaiting financial verification.' 
              : request.status === 'approved'
                ? 'This request has been fully approved by both you and Finance.'
                : 'This request has been rejected.'}
            
            {request.approverComments && (
              <div className="mt-2 p-3 bg-white/50 rounded-md border border-current/20">
                <p className="font-medium text-sm">Your Comments:</p>
                <p className="text-sm mt-1">{request.approverComments}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-primary" />
            <h3 className="text-lg font-medium">Approval Action</h3>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Review the request carefully before making a decision. After your approval, the request will be sent to Finance for verification.
          </p>
          
          <div className="mb-6 bg-muted/10 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  <span className="text-sm font-medium">Employee:</span>
                  <span>{request.employeeName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-primary" />
                  <span className="text-sm font-medium">Department:</span>
                  <span>{request.department}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-primary" />
                  <span className="text-sm font-medium">Project:</span>
                  <span>{request.project === 'other' ? request.projectOther : request.project?.replace('-', ' ')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span className="text-sm font-medium">Location:</span>
                  <span>{request.location === 'other' ? request.locationOther : request.location}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-sm font-medium">Travel Period:</span>
                  <span>
                    {new Date(request.travelDateFrom).toLocaleDateString()} - {new Date(request.travelDateTo).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span className="text-sm font-medium">Purpose:</span>
                  <span>{request.purpose}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-primary" />
                  <span className="text-sm font-medium">Request Amount:</span>
                  <Badge className="bg-primary/10 text-primary border-0 font-medium">
                    Nrs.{request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Badge>
                </div>
                
                {request.previousOutstandingAdvance > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">Previous Outstanding:</span>
                    <Badge className="bg-amber-100 text-amber-800 border-0 font-medium">
                      Nrs.{request.previousOutstandingAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </Badge>
                  </div>
                )}
                
                {request.previousOutstandingAdvance > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-primary font-bold" />
                    <span className="text-sm font-bold">Combined Total:</span>
                    <Badge className="bg-primary/20 text-primary border-0 font-bold">
                      Nrs.{calculateCombinedTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">Comments (Optional)</label>
            <Textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Add any comments or notes regarding your decision..."
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Your comments will be visible to the requester and finance team
              </p>
              <p className="text-xs text-muted-foreground">
                {approvalComment.length} characters
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
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
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCheck size={16} className="text-primary" />
              Approval Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/10 rounded-lg">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-medium text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Manager Approval</p>
                    <p className="text-sm text-muted-foreground">You review and approve the request based on business need and policy compliance.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-medium text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Financial Verification</p>
                    <p className="text-sm text-muted-foreground">The Finance team verifies expenses, receipt documentation, and budget compliance.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-sm font-medium text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Final Approval</p>
                    <p className="text-sm text-muted-foreground">Once verified by Finance, the request is fully approved and processed for payment.</p>
                  </div>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck size={16} className="text-primary" />
              Approval Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted/10 rounded-md flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Verify Request Details</p>
                  <p className="text-xs text-muted-foreground">
                    Confirm that the travel purpose aligns with business needs and the employee's role.
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-md flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Check Expense Amounts</p>
                  <p className="text-xs text-muted-foreground">
                    Ensure that all expenses are reasonable and adhere to company policy limits.
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-md flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Review Supporting Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Verify that all required receipts and supporting documents have been provided.
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-md flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Check Outstanding Advances</p>
                  <p className="text-xs text-muted-foreground">
                    Review any previous outstanding advances and ensure they won't impact this request.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText size={16} className="text-primary" />
            Policy Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/10 rounded-md">
              <p className="font-medium text-sm mb-1">Travel Authorization</p>
              <p className="text-xs text-muted-foreground">
                All travel requests must be approved before travel dates. Emergency requests require additional justification.
              </p>
            </div>
            
            <div className="p-3 bg-muted/10 rounded-md">
              <p className="font-medium text-sm mb-1">Expense Limits</p>
              <p className="text-xs text-muted-foreground">
                Per diem is limited to Nrs.1,500 per day. Accommodation costs must comply with city-specific limits.
              </p>
            </div>
            
            <div className="p-3 bg-muted/10 rounded-md">
              <p className="font-medium text-sm mb-1">Receipt Requirements</p>
              <p className="text-xs text-muted-foreground">
                All expenses above Nrs.500 require original receipts. Receipts must be in company name.
              </p>
            </div>
            
            <div className="p-3 bg-muted/10 rounded-md">
              <p className="font-medium text-sm mb-1">Advance Settlement</p>
              <p className="text-xs text-muted-foreground">
                All travel advances must be settled within 7 days of return. Outstanding advances may affect future requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}