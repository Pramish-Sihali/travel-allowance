'use client';

import { useState, useEffect } from 'react';
import { LeaveRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar,
  Check,
  X,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface LeaveRequestsPanelProps {
  approverId: string;
}

export default function LeaveRequestsPanel({ approverId }: LeaveRequestsPanelProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, [approverId]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(`/api/leave-requests?approverId=${approverId}`);
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status,
        }),
      });

      if (response.ok) {
        // Update local state
        setLeaveRequests(prev =>
          prev.map(req =>
            req.id === requestId ? { ...req, status } : req
          )
        );

        // The API now handles notification creation internally, so no additional call needed
        toast.success(`Leave request has been ${status}.`);

        setDialogOpen(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast.error("Failed to update leave request.");
    }
  };

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType) {
      case 'sick':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'vacation':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'personal':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    }
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserX size={18} />
            Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX size={18} className="text-orange-600" />
              <span>Leave Requests</span>
            </div>
            {pendingRequests.length > 0 && (
              <Badge className="bg-orange-100 text-orange-800">
                {pendingRequests.length} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-6">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No leave requests</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {leaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      request.status === 'pending'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getLeaveTypeIcon(request.leaveType)}
                          <span className="font-medium text-sm">
                            {request.employeeName}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave
                          {request.isAdvanced && (
                            <span className="ml-1 text-blue-600 font-medium">(Advanced)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogOpen(true);
                          }}
                          className="h-7 w-7"
                        >
                          <Eye size={12} />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleLeaveRequest(request.id, 'approved')}
                              className="h-7 w-7 text-green-600 hover:bg-green-50"
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleLeaveRequest(request.id, 'rejected')}
                              className="h-7 w-7 text-red-600 hover:bg-red-50"
                            >
                              <X size={12} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Employee</label>
                <p className="text-sm">{selectedRequest.employeeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Leave Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {getLeaveTypeIcon(selectedRequest.leaveType)}
                  <span className="text-sm capitalize">{selectedRequest.leaveType}</span>
                  {selectedRequest.isAdvanced && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Advanced Request
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedRequest.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleLeaveRequest(selectedRequest.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleLeaveRequest(selectedRequest.id, 'rejected')}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}