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
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
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

interface Request {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  purpose: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approverComment?: string;
  financeComment?: string;
  submittedDate: string;
  expenseItems?: Array<{
    id: string;
    category: string;
    amount: number;
    description?: string;
  }>;
}

export default function ExpensesDashboard() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [financeComment, setFinanceComment] = useState('');
  
  const userRole = session?.user?.role as 'employee' | 'approver' | 'checker' | 'admin';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinanceComment = async () => {
    if (!selectedRequest || !financeComment.trim()) return;

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}/finance-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: financeComment,
        }),
      });

      if (response.ok) {
        fetchRequests();
        setShowCommentDialog(false);
        setFinanceComment('');
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error adding finance comment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle }
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

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = !searchQuery || 
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    totalAmount: requests.reduce((sum, r) => sum + r.totalAmount, 0)
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
                <p className="text-muted-foreground">Loading expenses...</p>
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
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-lato">Expenses Dashboard</h1>
                  <p className="text-muted-foreground font-nunito mt-1">
                    View and manage travel requests with expenses and finance comments
                  </p>
                </div>
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
                    <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">₹{stats.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Travel Requests & Expenses
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
                        placeholder="Search by name, destination, or purpose..."
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
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Requests Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.userName}</div>
                              <div className="text-sm text-muted-foreground">{request.department}</div>
                            </div>
                          </TableCell>
                          <TableCell>{request.destination}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate" title={request.purpose}>
                              {request.purpose}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(request.startDate).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                to {new Date(request.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{request.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {request.approverComment && (
                                <Badge variant="outline" className="text-xs">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Approver
                                </Badge>
                              )}
                              {request.financeComment && (
                                <Badge variant="outline" className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Finance
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Request Details - {request.userName}</DialogTitle>
                                    <DialogDescription>
                                      Submitted on {new Date(request.submittedDate).toLocaleDateString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Destination:</label>
                                        <p>{request.destination}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Total Amount:</label>
                                        <p className="font-bold">₹{request.totalAmount.toLocaleString()}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Purpose:</label>
                                      <p>{request.purpose}</p>
                                    </div>
                                    {request.approverComment && (
                                      <div>
                                        <label className="text-sm font-medium">Approver Comment:</label>
                                        <p className="bg-muted p-2 rounded">{request.approverComment}</p>
                                      </div>
                                    )}
                                    {request.financeComment && (
                                      <div>
                                        <label className="text-sm font-medium">Finance Comment:</label>
                                        <p className="bg-blue-50 p-2 rounded">{request.financeComment}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {(userRole === 'admin' || userRole === 'checker') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setFinanceComment(request.financeComment || '');
                                    setShowCommentDialog(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
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

      {/* Finance Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finance Comment</DialogTitle>
            <DialogDescription>
              Add or update finance comment for {selectedRequest?.userName}'s request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter finance comment..."
              value={financeComment}
              onChange={(e) => setFinanceComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFinanceComment}>
                Save Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}