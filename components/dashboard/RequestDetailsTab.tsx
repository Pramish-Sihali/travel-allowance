import { TravelRequest } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, 
  Calendar, 
  Building, 
  User,
  Briefcase,
  CreditCard,
  FileText,
  CalendarClock,
  Info,
  Car
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface RequestDetailsTabProps {
  request: TravelRequest;
  travelDates: {
    start: Date;
    end: Date;
    duration: number;
  };
}

export default function RequestDetailsTab({ request, travelDates }: RequestDetailsTabProps) {
  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Employee Information */}
        <div className="md:w-1/4 flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(request.employeeName)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-semibold text-center">{request.employeeName}</h3>
          <p className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
            <Building size={14} />
            {request.department}
          </p>
          <p className="text-muted-foreground text-sm mt-1">{request.designation}</p>
        </div>
        
        {/* Request Details */}
        <div className="md:w-3/4 space-y-4">
          {/* Purpose & Details */}
          <div className="bg-muted/10 p-4 rounded-md border">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Info size={16} className="text-primary" />
              Purpose & Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                <p className="font-medium">{request.purpose}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Project</p>
                <p className="font-medium capitalize">
                  {request.project === 'other' ? request.projectOther : request.project?.replace('-', ' ')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-medium capitalize">
                  {request.location === 'other' ? request.locationOther : request.location}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Request Type</p>
                <Badge className={cn(
                  "flex items-center gap-1.5 w-fit",
                  !request.requestType || request.requestType === 'normal' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : request.requestType === 'advance' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : request.requestType === 'in-valley'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                )}>
                  <span className="flex items-center gap-1.5">
                    {request.requestType === 'normal' && <FileText className="h-3 w-3" />}
                    {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                    {request.requestType === 'in-valley' && <MapPin className="h-3 w-3" />}
                    {request.requestType === 'emergency' && <FileText className="h-3 w-3" />}
                    {request.requestType === 'in-valley' ? 'In-Valley' : 
                      request.requestType ? (request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)) : 'Normal'}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Travel Period */}
          {request.requestType !== 'in-valley' ? (
            <div className="bg-muted/10 p-4 rounded-md border">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Travel Period
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">From Date</p>
                  <p className="font-medium">{formatDate(travelDates.start)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">To Date</p>
                  <p className="font-medium">{formatDate(travelDates.end)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium">{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/10 p-4 rounded-md border">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Expense Date
              </h3>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date</p>
                <p className="font-medium">
                  {formatDate(new Date(request.expenseDate || request.travelDateFrom))}
                </p>
              </div>
            </div>
          )}
          
          {/* Transportation Details (for travel requests) */}
          {request.requestType !== 'in-valley' && (
            <div className="bg-muted/10 p-4 rounded-md border">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Car size={16} className="text-primary" />
                Transportation Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transport Mode</p>
                  <p className="font-medium capitalize">{request.transportMode || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Station Pick/Drop</p>
                  <p className="font-medium capitalize">{request.stationPickDrop || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Local Conveyance</p>
                  <p className="font-medium capitalize">{request.localConveyance || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Details (for in-valley requests) */}
          {request.requestType === 'in-valley' && (
            <div className="bg-muted/10 p-4 rounded-md border">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                Payment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-medium capitalize">{request.paymentMethod || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-medium text-primary">
                    Nrs.{(request.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
              
              {request.description && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{request.description}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Additional Information */}
          <div className="bg-muted/10 p-4 rounded-md border">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="font-bold text-primary">
                  Nrs.{(request.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
              
              {request.previousOutstandingAdvance !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Previous Outstanding Advance</p>
                  <p className={request.previousOutstandingAdvance > 0 ? "font-bold text-amber-600" : "font-medium"}>
                    Nrs.{(request.previousOutstandingAdvance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Submitted On</p>
                <p className="font-medium">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Request ID</p>
                <p className="font-mono text-sm bg-muted/20 p-1 rounded">{request.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}