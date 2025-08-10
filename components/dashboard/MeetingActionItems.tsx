'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { 
  Calendar,
  Clock,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Play,
  Timer,
  ExternalLink,
  Pause,
  Square
} from 'lucide-react';
// Using native Date methods instead of date-fns

interface MeetingActionItem {
  id: string;
  content: string;
  responsibility: string;
  completion_status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  priority?: string;
  remarks?: string;
  is_done: boolean;
  meeting: {
    id: string;
    title: string;
    meeting_date: string;
    meeting_time?: string;
    location: string;
    meeting_type: string;
    priority: string;
    created_by_name: string;
  };
}

interface MeetingActionItemsProps {
  employeeId: string;
}

export default function MeetingActionItems({ employeeId }: MeetingActionItemsProps) {
  const { toast } = useToast();
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActionItems: 0,
    pendingActionItems: 0,
    completedActionItems: 0,
    overdueActionItems: 0,
    dueTodayActionItems: 0
  });

  // Time tracking hook
  const {
    currentLog,
    isRunning,
    isPaused,
    elapsedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime
  } = useTimeTracker(employeeId);

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meetings/action-items?employeeId=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setActionItems(data.actionItems || []);
        setStats(data.stats || stats);
      } else {
        toast.error("Failed to load meeting action items");
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast.error("Failed to load meeting action items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchActionItems();
    }
  }, [employeeId]);

  const updateActionItemStatus = async (actionItemId: string, status: string, remarks?: string) => {
    try {
      const response = await fetch('/api/meetings/action-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionItemId,
          status,
          remarks
        })
      });

      if (response.ok) {
        toast.success("Action item updated successfully");
        fetchActionItems(); // Refresh the list
      } else {
        toast.error("Failed to update action item");
      }
    } catch (error) {
      console.error('Error updating action item:', error);
      toast.error("Failed to update action item");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatMeetingTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const now = new Date();
    return dueDate < now;
  };

  const isToday = (dueDateString?: string) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  // Time tracking functions
  const handleStartTimer = (actionItem: MeetingActionItem) => {
    const description = `Working on: ${actionItem.responsibility || actionItem.content}`;
    startTimer(description, undefined, actionItem.id, false);
    updateActionItemStatus(actionItem.id, 'in_progress');
  };

  const handlePauseTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else if (isPaused) {
      resumeTimer();
    }
  };

  const handleStopTimer = async (actionItemId: string, markComplete = false) => {
    const timeLog = await stopTimer();
    if (timeLog) {
      toast.success(`Time Tracking Stopped - Logged ${formatTime(timeLog.totalDuration)} for this action item`);
      
      if (markComplete) {
        updateActionItemStatus(actionItemId, 'completed', `Completed after ${formatTime(timeLog.totalDuration)} of work`);
      }
      
      fetchActionItems(); // Refresh to show updated data
    }
  };

  const isTrackingThisItem = (actionItemId: string) => {
    return currentLog?.meetingActionItemId === actionItemId;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.totalActionItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingActionItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{stats.completedActionItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdueActionItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Due Today</p>
                <p className="text-2xl font-bold">{stats.dueTodayActionItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items List */}
      {actionItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Action Items</h3>
            <p className="text-muted-foreground">
              You don't have any meeting action items assigned to you yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actionItems.map((item) => (
            <Card key={item.id} className={`${isOverdue(item.due_date) && item.completion_status !== 'completed' ? 'border-red-200 bg-red-50/30' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg leading-tight">
                      {item.responsibility || item.content}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(item.completion_status)}>
                        {item.completion_status.replace('_', ' ')}
                      </Badge>
                      {item.priority && (
                        <Badge variant="outline" className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      )}
                      {isOverdue(item.due_date) && item.completion_status !== 'completed' && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                      {isToday(item.due_date) && item.completion_status !== 'completed' && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Due Today
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Meeting Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">From Meeting:</span>
                    <span className="text-sm">{item.meeting.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.meeting.meeting_date)}
                    </div>
                    {item.meeting.meeting_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatMeetingTime(item.meeting.meeting_time)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                {item.due_date && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Due:</span>
                    <span className={`text-sm ${isOverdue(item.due_date) && item.completion_status !== 'completed' ? 'text-red-600 font-medium' : ''}`}>
                      {formatDate(item.due_date)}
                    </span>
                  </div>
                )}

                {/* Remarks */}
                {item.remarks && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Notes:</span> {item.remarks}
                  </div>
                )}

                {/* Time Tracking Display */}
                {isTrackingThisItem(item.id) && (
                  <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Time Tracking: {formatTime(elapsedTime)}
                        </span>
                        {isPaused && (
                          <Badge variant="outline" className="text-xs">Paused</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {/* Time tracking controls */}
                  {!isTrackingThisItem(item.id) && item.completion_status !== 'completed' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartTimer(item)}
                      disabled={isRunning && !isTrackingThisItem(item.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Timer
                    </Button>
                  )}

                  {isTrackingThisItem(item.id) && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handlePauseTimer}
                      >
                        {isPaused ? (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        )}
                      </Button>

                      <Button 
                        size="sm" 
                        onClick={() => handleStopTimer(item.id, false)}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop Timer
                      </Button>

                      <Button 
                        size="sm" 
                        onClick={() => handleStopTimer(item.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete & Stop
                      </Button>
                    </>
                  )}

                  {/* Manual completion for non-tracked items */}
                  {!isTrackingThisItem(item.id) && item.completion_status !== 'completed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateActionItemStatus(item.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(`/mom?meetingId=${item.meeting.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}