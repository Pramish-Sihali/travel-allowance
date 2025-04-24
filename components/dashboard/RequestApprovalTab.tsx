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
  Briefcase,
  Clock
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

  // Get the formatted emergency reason
  const getFormattedEmergencyReason = (reason: string) => {
    switch(reason) {
      case 'urgent-meeting': return 'Urgent Meeting';
      case 'crisis-response': return 'Crisis Response';
      case 'time-sensitive': return 'Time-Sensitive Opportunity';
      case 'medical': return 'Medical Emergency';
      case 'other': return request.emergencyReasonOther || 'Other';
      default: return reason;
    }
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
          
          {/* Display advance request information */}
          {request.requestType === 'advance' && (
            <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <AlertTitle>Advance Request</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-medium text-sm">Estimated Amount:</p>
                  <p className="mb-2">Nrs. {parseFloat(request.estimatedAmount || '0').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  
                  <p className="font-medium text-sm">Advance Notes:</p>
                  <p className="text-sm whitespace-pre-line">{request.advanceNotes}</p>
                </div>
                <div className="mt-3 text-sm bg-amber-100/50 p-2 rounded border border-amber-300">
                  <p className="font-medium">Note:</p>
                  <p>If approved, this advance request will be immediately forwarded to Finance for processing.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Display emergency request information */}
          {request.requestType === 'emergency' && (
            <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle>Emergency Request</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-medium text-sm">Emergency Reason:</p>
                  <p className="mb-2">{getFormattedEmergencyReason(request.emergencyReason || '')}</p>
                  
                  <p className="font-medium text-sm">Emergency Justification:</p>
                  <p className="text-sm whitespace-pre-line">{request.emergencyJustification}</p>
                </div>
                <div className="mt-3 text-sm bg-red-100/50 p-2 rounded border border-red-300">
                  <p className="font-medium">Important Note:</p>
                  <p>This is an emergency request that requires immediate attention. If approved, it will be immediately forwarded to Finance for expedited processing.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
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
      
      {/* Special considerations for emergency requests */}
      {request.requestType === 'emergency' && (
        <Card className="shadow-sm border-red-200">
          <CardHeader className="pb-3 bg-red-50">
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <Clock size={16} className="text-red-600" />
              Emergency Request Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-md">
                <p className="font-medium text-sm text-red-800 mb-1">Special Considerations</p>
                <p className="text-xs text-red-700">
                  Emergency requests should only be approved when there is a genuine urgency that couldn't have been planned in advance. Verify that the justification provided is legitimate and meets company policy for emergency travel.
                </p>
              </div>
              
              <div className="p-3 bg-red-50 rounded-md">
                <p className="font-medium text-sm text-red-800 mb-1">Expedited Processing</p>
                <p className="text-xs text-red-700">
                  If approved, this request will be immediately forwarded to Finance for expedited processing, potentially bypassing normal processing times. Please ensure this level of priority is warranted.
                </p>
              </div>
              
              <div className="p-3 bg-red-50 rounded-md">
                <p className="font-medium text-sm text-red-800 mb-1">Documentation Requirements</p>
                <p className="text-xs text-red-700">
                  Even though this is an emergency request, ensure the employee understands they will still need to provide all standard documentation and receipts for later verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Special considerations for advance requests */}
      {request.requestType === 'advance' && (
        <Card className="shadow-sm border-amber-200">
          <CardHeader className="pb-3 bg-amber-50">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <DollarSign size={16} className="text-amber-600" />
              Advance Request Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-md">
                <p className="font-medium text-sm text-amber-800 mb-1">Amount Verification</p>
                <p className="text-xs text-amber-700">
                  Verify that the requested advance amount is reasonable and in line with estimated expenses for the travel duration and location.
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-md">
                <p className="font-medium text-sm text-amber-800 mb-1">Settlement Timeline</p>
                <p className="text-xs text-amber-700">
                  Employees must settle advances within 7 days of returning from travel. Ensure the employee is aware of this requirement.
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-md">
                <p className="font-medium text-sm text-amber-800 mb-1">Outstanding Advances</p>
                <p className="text-xs text-amber-700">
                  Check if the employee has any outstanding unsettled advances before approving a new one. Company policy may restrict multiple outstanding advances.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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