'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AttendanceRecord, LeaveRequest, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar, 
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface AttendancePanelProps {
  userId: string;
  userName: string;
}

export default function AttendancePanel({ userId, userName }: AttendancePanelProps) {
  const router = useRouter();
  const [todayStatus, setTodayStatus] = useState<'present' | 'leave' | null>(null);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [advancedLeaveDialogOpen, setAdvancedLeaveDialogOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedApprover, setSelectedApprover] = useState('');
  const [leaveType, setLeaveType] = useState<'sick' | 'personal' | 'vacation' | 'emergency' | 'other'>('sick');
  
  // Reset form when dialogs close
  const resetForm = () => {
    setLeaveReason('');
    setSelectedApprover('');
    setLeaveType('sick');
  };
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayAttendance();
    fetchApprovers();
  }, [userId]);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance?employeeId=${userId}&date=${today}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setTodayStatus(data[0].status);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchApprovers = async () => {
    try {
      const response = await fetch('/api/approvers');
      if (response.ok) {
        const data = await response.json();
        // The API returns {value, label, email} format, convert to User format
        const approversData = data.map((approver: any) => ({
          id: approver.value,
          name: approver.label,
          email: approver.email,
          role: 'approver' as const,
          department: '',
          designation: '',
          createdAt: '',
          updatedAt: ''
        }));
        setApprovers(approversData);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const markPresent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: userId,
          employeeName: userName,
          status: 'present',
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setTodayStatus('present');
        toast.success("You have been marked present for today.");
        
        // Trigger a refresh event for attendance sheet if it's open
        window.dispatchEvent(new Event('attendanceUpdated'));
      } else {
        throw new Error('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error("Failed to mark attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitLeaveRequest = async (isAdvanced = false) => {
    // Validate form
    if (!leaveReason.trim()) {
      toast.error("Please provide a reason for your leave request.");
      return;
    }
    
    if (leaveReason.trim().length < 10) {
      toast.error("Please provide a more detailed reason (at least 10 characters).");
      return;
    }
    
    if (!selectedApprover) {
      toast.error("Please select an approver for your leave request.");
      return;
    }

    setLoading(true);
    try {
      // Create leave request
      const leaveResponse = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: userId,
          employeeName: userName,
          leaveType,
          reason: leaveReason,
          approverId: selectedApprover,
          isAdvanced,
        }),
      });

      if (!leaveResponse.ok) {
        throw new Error('Failed to submit leave request');
      }

      // If not advanced leave, also mark attendance as leave for today
      if (!isAdvanced) {
        const attendanceResponse = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: userId,
            employeeName: userName,
            status: 'leave',
            date: new Date().toISOString().split('T')[0],
            leaveType,
            leaveReason,
            approver: selectedApprover,
            isAdvancedLeave: false,
            timestamp: new Date().toISOString(),
          }),
        });

        if (attendanceResponse.ok) {
          setTodayStatus('leave');
          // Trigger a refresh event for attendance sheet if it's open
          window.dispatchEvent(new Event('attendanceUpdated'));
        }
      }

      // Send notification to approver
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedApprover,
          message: `${userName} has submitted a ${isAdvanced ? 'advanced ' : ''}leave request: ${leaveType} - ${leaveReason}`,
        }),
      });

      toast.success(`Your ${isAdvanced ? 'advanced ' : ''}leave request has been sent to the approver.`);

      // Reset form and close dialogs
      resetForm();
      setLeaveDialogOpen(false);
      setAdvancedLeaveDialogOpen(false);
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error("Failed to submit leave request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (todayStatus) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'leave':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (todayStatus) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Present</Badge>;
      case 'leave':
        return <Badge className="bg-red-100 text-red-800 border-red-200">On Leave</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Not Marked</Badge>;
    }
  };

  const LeaveDialog = ({ isAdvanced = false }: { isAdvanced?: boolean }) => (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isAdvanced ? 'Advanced Leave Request' : 'Leave Request'}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Leave Type</label>
          <Select value={leaveType} onValueChange={(value: any) => setLeaveType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[60]">
              <SelectItem value="sick">Sick Leave</SelectItem>
              <SelectItem value="personal">Personal Leave</SelectItem>
              <SelectItem value="vacation">Vacation</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Reason *</label>
          <Textarea
            placeholder="Please provide a detailed reason for your leave request..."
            value={leaveReason}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setLeaveReason(e.target.value);
              }
            }}
            rows={4}
            className="mt-1 resize-none"
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className={`text-xs ${
              leaveReason.length < 10 ? 'text-red-500' : 
              leaveReason.length >= 10 ? 'text-green-600' : 'text-gray-500'
            }`}>
              {leaveReason.length < 10 ? `${10 - leaveReason.length} more characters needed` : 'Good length'}
            </p>
            <p className="text-xs text-gray-400">
              {leaveReason.length}/500
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Select Approver</label>
          <Select value={selectedApprover} onValueChange={setSelectedApprover}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an approver" />
            </SelectTrigger>
            <SelectContent className="z-[60]">
              {approvers.map((approver) => (
                <SelectItem key={approver.id} value={approver.id}>
                  {approver.name} {approver.email ? `(${approver.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdvanced && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is an advanced leave request that can be submitted ahead of time.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setLeaveDialogOpen(false);
              setAdvancedLeaveDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => submitLeaveRequest(isAdvanced)}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>Attendance</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Today • {new Date().toLocaleDateString()}
            </div>
          </div>

          {todayStatus === null && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Mark your attendance for today
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={markPresent}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Present
                </Button>
                <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Leave
                    </Button>
                  </DialogTrigger>
                  <LeaveDialog />
                </Dialog>
              </div>
            </div>
          )}

          {todayStatus !== null && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                {todayStatus === 'present' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Present</span>
                  </>
                )}
                {todayStatus === 'leave' && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">On Leave</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => router.push('/attendance-sheet')}
              >
                View Sheet
              </Button>
            </div>
          )}

          <div className="pt-3 border-t">
            <Dialog open={advancedLeaveDialogOpen} onOpenChange={setAdvancedLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Advanced Leave Request
                </Button>
              </DialogTrigger>
              <LeaveDialog isAdvanced />
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}