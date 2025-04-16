import { TravelRequest } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, 
  Calendar, 
  Building, 
  AlertTriangle,
  Info,
  FileText,
  CreditCard,
  User,
  Briefcase,
  CalendarClock,
  Target,
  Navigation,
  CarFront
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
  
  const getFormattedStatus = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return 'Under Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-row md:flex-col items-center gap-4 md:mr-4">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(request.employeeName)}
            </AvatarFallback>
          </Avatar>
          <div className="md:text-center">
            <h3 className="text-lg font-semibold mt-2">{request.employeeName}</h3>
            <p className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
              <Building size={14} />
              {request.department}
            </p>
            <p className="text-muted-foreground text-sm mt-1">{request.designation}</p>
          </div>
        </div>
        
        <div className="flex-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Target size={16} className="text-primary" />
                Purpose & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText size={12} className="text-primary" />
                    Purpose
                  </p>
                  <p className="font-medium">{request.purpose}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/10 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin size={12} className="text-primary" />
                      Location
                    </p>
                    <p className="font-medium capitalize">
                      {request.location === 'other' ? request.locationOther : request.location}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/10 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Briefcase size={12} className="text-primary" />
                      Project
                    </p>
                    <p className="font-medium capitalize">
                      {request.project === 'other' ? request.projectOther : request.project?.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Travel Period
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-primary" />
                    From Date
                  </p>
                  <p className="font-medium">
                    {travelDates.start.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-primary" />
                    To Date
                  </p>
                  <p className="font-medium">
                    {travelDates.end.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarClock size={12} className="text-primary" />
                    Duration
                  </p>
                  <p className="font-medium">
                    {travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <CarFront size={16} className="text-primary" />
                Transportation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Transport Mode</p>
                  <p className="font-medium capitalize">{request.transportMode || 'Not specified'}</p>
                </div>
                
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Station Pick/Drop</p>
                  <p className="font-medium capitalize">{request.stationPickDrop || 'N/A'}</p>
                </div>
                
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Local Conveyance</p>
                  <p className="font-medium capitalize">{request.localConveyance || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Ride Share Used</p>
                  <p className="font-medium">{request.rideShareUsed ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="p-3 bg-muted/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Own Vehicle Reimbursement</p>
                  <p className="font-medium">{request.ownVehicleReimbursement ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Info size={16} className="text-primary" />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Status</p>
                  <Badge className={getStatusBadgeClass(request.status)}>
                    {getFormattedStatus(request.status)}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Request Type</p>
                  <Badge className={cn(
                    "flex items-center gap-1.5 w-fit",
                    !request.requestType || request.requestType === 'normal' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : request.requestType === 'advance' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                  )}>
                    <span className="flex items-center gap-1.5">
                      {request.requestType === 'normal' && <FileText className="h-3 w-3" />}
                      {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                      {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                      {(request.requestType || 'normal').charAt(0).toUpperCase() + (request.requestType || 'normal').slice(1)}
                    </span>
                  </Badge>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Amount</p>
                  <p className="font-bold text-primary">
                    Nrs.{(request.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
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
              
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Request ID</p>
                  <p className="font-mono text-sm bg-muted/20 p-1 rounded">{request.id}</p>
                </div>
                
                {request.previousOutstandingAdvance !== undefined && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
                      {request.previousOutstandingAdvance > 0 ? (
                        <AlertTriangle size={12} className="text-amber-600" />
                      ) : (
                        <Info size={12} className="text-blue-600" />
                      )}
                      Previous Outstanding Advance
                    </p>
                    <p className={cn(
                      "font-medium",
                      request.previousOutstandingAdvance > 0 ? "text-amber-700" : ""
                    )}>
                      Nrs.{(request.previousOutstandingAdvance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}