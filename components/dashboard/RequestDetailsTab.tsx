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
  CreditCard
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
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(request.employeeName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{request.employeeName}</h3>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building size={14} />
            {request.department} • {request.designation}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Travel Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{request.purpose}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Travel Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Duration</span>
                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                  {travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {request.previousOutstandingAdvance !== undefined && request.previousOutstandingAdvance > 0 && (
          <Card className="md:col-span-2 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle size={16} className="text-amber-500" />
                Previous Outstanding Advance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-amber-700">This employee has a previous outstanding advance that hasn't been cleared:</p>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  ${request.previousOutstandingAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info size={16} className="text-primary" />
            Request Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Status</p>
              <Badge className={getStatusBadgeClass(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm mb-1">Request Type</p>
              <Badge className={cn(
                request.requestType === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                request.requestType === 'advance' ? 'bg-green-100 text-green-800 border-green-200' :
                'bg-red-100 text-red-800 border-red-200'
              )}>
                <span className="flex items-center gap-1.5">
                  {request.requestType === 'normal' && <FileText className="h-3 w-3" />}
                  {request.requestType === 'advance' && <CreditCard className="h-3 w-3" />}
                  {request.requestType === 'emergency' && <AlertTriangle className="h-3 w-3" />}
                  {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
                </span>
              </Badge>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Amount</p>
              <p className="font-bold text-primary">
                ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm mb-1">Submitted On</p>
              <p>
                {new Date(request.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm mb-1">Request ID</p>
              <p className="font-mono text-sm truncate">{request.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}