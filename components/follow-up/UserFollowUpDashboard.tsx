'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  User,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  CheckCircle2,
  CircleDot,
  Flag,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface UserActionItem {
  id: string;
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_time?: string;
  meeting_status: string;
  meeting_created_by: string;
  responsibility: string;
  assigned_to_name: string;
  deadline?: string;
  deadline_time?: string;
  priority: string;
  remarks: string;
  is_done: boolean;
  completion_status: string;
  completion_percentage: number;
  flags: string;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface FollowUpStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

interface UserFollowUpDashboardProps {
  userId: string;
  userName: string;
}

const PRIORITY_COLORS = {
  'low': 'bg-green-100 text-green-700 border-green-200',
  'medium': 'bg-blue-100 text-blue-700 border-blue-200',
  'high': 'bg-orange-100 text-orange-700 border-orange-200',
  'critical': 'bg-red-100 text-red-700 border-red-200'
};

export default function UserFollowUpDashboard({ userId, userName }: UserFollowUpDashboardProps) {
  const [actionItems, setActionItems] = useState<UserActionItem[]>([]);
  const [stats, setStats] = useState<FollowUpStats>({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string>('');

  useEffect(() => {
    fetchUserFollowUps();
  }, [userId]);

  const fetchUserFollowUps = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/follow-ups/user?userId=${userId}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups');
      }
      
      const data = await response.json();
      setActionItems(data.actionItems || []);
      setStats(data.stats || { total: 0, completed: 0, pending: 0, overdue: 0 });
    } catch (error) {
      console.error('Error fetching user follow-ups:', error);
      toast.error('Failed to load follow-up tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (itemId: string, currentStatus: boolean) => {
    setUpdating(itemId);
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`/api/follow-ups/user?itemId=${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_done: newStatus,
          completion_status: newStatus ? 'completed' : 'pending',
          completion_percentage: newStatus ? 100 : 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Update local state
      setActionItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                is_done: newStatus,
                completion_status: newStatus ? 'completed' : 'pending',
                completion_percentage: newStatus ? 100 : 0,
                completed_at: newStatus ? new Date().toISOString() : undefined,
                completed_by: newStatus ? userName : undefined,
              }
            : item
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        completed: newStatus ? prev.completed + 1 : prev.completed - 1,
        pending: newStatus ? prev.pending - 1 : prev.pending + 1,
      }));
      
      toast.success(`Task marked as ${newStatus ? 'completed' : 'pending'}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setUpdating('');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      let result = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (timeString) {
        result += ` at ${timeString}`;
      }
      return result;
    } catch {
      return dateString;
    }
  };

  const isOverdue = (deadline?: string, isDone?: boolean) => {
    if (!deadline || isDone) return false;
    return new Date(deadline) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority.toLowerCase() as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your follow-up tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <Target className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <CircleDot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tasks Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-3">
              <CheckSquare className="h-6 w-6 text-primary" />
              Your Action Items
            </CardTitle>
            <Button onClick={fetchUserFollowUps} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {actionItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">No follow-up tasks assigned</p>
                <p className="text-sm text-muted-foreground">
                  Your personal action items from meetings will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/30">
                      <TableHead className="w-20 h-12 font-semibold">Status</TableHead>
                      <TableHead className="min-w-[200px] h-12 font-semibold">Task</TableHead>
                      <TableHead className="min-w-[200px] h-12 font-semibold">Meeting</TableHead>
                      <TableHead className="w-32 h-12 font-semibold">Priority</TableHead>
                      <TableHead className="w-36 h-12 font-semibold">Deadline</TableHead>
                      <TableHead className="min-w-[150px] h-12 font-semibold">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionItems.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className={`border-b transition-colors hover:bg-muted/20 ${
                          item.is_done ? 'bg-green-50/30' : ''
                        } ${
                          isOverdue(item.deadline, item.is_done) ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <TableCell className="py-4">
                          <Button
                            variant={item.is_done ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleStatus(item.id, item.is_done)}
                            disabled={updating === item.id}
                            className={`w-full h-9 ${
                              item.is_done 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                            }`}
                          >
                            {updating === item.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : item.is_done ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Done
                              </>
                            ) : (
                              <>
                                <CircleDot className="h-4 w-4 mr-1" />
                                Pending
                              </>
                            )}
                          </Button>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className={`space-y-1 ${item.is_done ? 'opacity-75' : ''}`}>
                            <div className={`font-medium leading-relaxed ${item.is_done ? 'line-through text-muted-foreground' : ''}`}>
                              {item.responsibility}
                            </div>
                            {item.flags && (
                              <div className="flex flex-wrap gap-1">
                                {item.flags.split(',').filter(flag => flag.trim()).map((flag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {flag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">{item.meeting_title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {formatDateTime(item.meeting_date, item.meeting_time)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.meeting_status}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <Badge className={`${getPriorityColor(item.priority)} px-3 py-1`} variant="outline">
                            <Flag className="h-3 w-3 mr-1" />
                            {item.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={`text-sm ${
                              isOverdue(item.deadline, item.is_done) ? 'text-red-600 font-medium' : ''
                            }`}>
                              {formatDate(item.deadline)}
                            </span>
                            {isOverdue(item.deadline, item.is_done) && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            {item.remarks || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}