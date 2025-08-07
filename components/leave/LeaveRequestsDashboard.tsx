'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Plus,
  Search, 
  Filter, 
  Calendar, 
  Clock,
  User,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency';
  reason: string;
  isAdvanced: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approverId?: string;
  approverName?: string;
}

interface NewLeaveRequest {
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency';
  reason: string;
  isAdvanced: boolean;
}

export default function LeaveRequestsDashboard() {
  const { data: session } = useSession();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [newRequest, setNewRequest] = useState<NewLeaveRequest>({
    leaveType: 'vacation',
    reason: '',
    isAdvanced: false
  });
  
  const userRole = session?.user?.role as 'employee' | 'approver' | 'checker' | 'admin';
  const isEmployee = userRole === 'employee';

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const endpoint = isEmployee 
        ? `/api/leave-requests?employeeId=${session?.user?.id}`
        : '/api/leave-requests';
      
      const response = await fetch(endpoint);
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

  const handleSubmitLeaveRequest = async () => {
    if (!newRequest.reason.trim()) return;

    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      });

      if (response.ok) {
        fetchLeaveRequests();
        setShowNewRequestDialog(false);
        setNewRequest({
          leaveType: 'vacation',
          reason: '',
          isAdvanced: false
        });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
    }
  };

  const handleLeaveRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
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
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType) {
      case 'sick':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'vacation':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'personal':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: Check },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: X }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = !searchQuery || 
      request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
    advanced: leaveRequests.filter(r => r.isAdvanced).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant={userRole} />
        <div className="flex">
          <Sidebar userRole={userRole} />
          <main className={cn("flex-1 transition-all duration-200", "md:ml-64", "p-6")}>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading leave requests...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant={userRole} />
      
      <div className="flex">
        <Sidebar userRole={userRole} />
        
        <main className={cn(
          "flex-1 transition-all duration-200",
          "md:ml-64",
          "p-6"
        )}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground font-lato">
                      {isEmployee ? 'My Leave Requests' : 'Leave Requests'}
                    </h1>
                    <p className="text-muted-foreground font-nunito mt-1">
                      {isEmployee 
                        ? 'Submit and track your leave requests'
                        : 'Manage employee leave requests and approvals'
                      }
                    </p>
                  </div>
                </div>
                
                {isEmployee && (
                  <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Leave Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Leave Request</DialogTitle>
                        <DialogDescription>
                          Fill in the details for your leave request
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Leave Type</label>
                          <Select 
                            value={newRequest.leaveType} 
                            onValueChange={(value: any) => 
                              setNewRequest(prev => ({ ...prev, leaveType: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vacation">Vacation</SelectItem>
                              <SelectItem value="sick">Sick Leave</SelectItem>
                              <SelectItem value="personal">Personal Leave</SelectItem>
                              <SelectItem value="emergency">Emergency Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="advanced"
                            checked={newRequest.isAdvanced}
                            onCheckedChange={(checked) =>
                              setNewRequest(prev => ({ ...prev, isAdvanced: checked }))
                            }
                          />
                          <label htmlFor="advanced" className="text-sm font-medium">
                            Advanced Leave Request
                          </label>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Reason</label>
                          <Textarea
                            placeholder="Please provide the reason for your leave..."
                            value={newRequest.reason}
                            onChange={(e) => 
                              setNewRequest(prev => ({ ...prev, reason: e.target.value }))
                            }
                            rows={4}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowNewRequestDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSubmitLeaveRequest}
                            disabled={!newRequest.reason.trim()}
                          >
                            Submit Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.advanced}</div>
                    <div className="text-sm text-muted-foreground">Advanced</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Leave Requests
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by employee name, reason, or leave type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Leave Requests Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {!isEmployee && <TableHead>Employee</TableHead>}
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        {!isEmployee && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          {!isEmployee && (
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.employeeName}</div>
                                <div className="text-sm text-muted-foreground">{request.department}</div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getLeaveTypeIcon(request.leaveType)}
                              <span className="capitalize">{request.leaveType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="truncate" title={request.reason}>
                              {request.reason}
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.isAdvanced ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                Advanced
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Regular
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          {!isEmployee && (
                            <TableCell>
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleLeaveRequestAction(request.id, 'approved')}
                                    className="text-green-600 hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleLeaveRequestAction(request.id, 'rejected')}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}