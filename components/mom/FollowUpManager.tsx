'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Plus,
  RefreshCw,
  ArrowRight,
  Target
} from 'lucide-react';
// Using built-in Date functions instead of date-fns

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  status: string;
  action_items_count: number;
  completed_action_items: number;
}

interface ActionItem {
  id: string;
  meeting_id: string;
  content: string;
  is_action_item: boolean;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  due_date?: string;
  assigned_to_name?: string;
  meeting_title: string;
  meeting_date: string;
  priority?: string;
  completion_percentage?: number;
}

interface FollowUpManagerProps {
  meetings: Meeting[];
  onFollowUpUpdated: () => void;
  userId?: string;
}

export default function FollowUpManager({ meetings, onFollowUpUpdated, userId }: FollowUpManagerProps) {
  const { toast } = useToast();
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string>(''); // Track which item is being updated

  // Get meetings that have action items or completed meetings for follow-up
  const availableMeetings = meetings.filter(meeting => 
    meeting.action_items_count > 0 || meeting.status === 'completed'
  );

  // Fetch action items for selected meeting
  const fetchActionItems = async (meetingId: string) => {
    if (!meetingId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/action-items`);
      if (response.ok) {
        const data = await response.json();
        setActionItems(data.actionItems || []);
      } else {
        toast.error("Failed to fetch action items");
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast.error("Failed to load action items");
    } finally {
      setLoading(false);
    }
  };

  // Update action item completion status
  const updateActionItemStatus = async (itemId: string, newStatus: string, completionPercentage?: number) => {
    setUpdating(itemId);
    try {
      const response = await fetch(`/api/meetings/action-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completion_status: newStatus,
          completion_percentage: completionPercentage || (newStatus === 'completed' ? 100 : 0),
          completed_by: userId,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        }),
      });

      if (response.ok) {
        // Update local state
        setActionItems(prev => prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                completion_status: newStatus as any,
                completion_percentage: completionPercentage || (newStatus === 'completed' ? 100 : 0)
              }
            : item
        ));

        toast.success("Action item updated successfully");

        onFollowUpUpdated();
      } else {
        throw new Error('Failed to update action item');
      }
    } catch (error) {
      console.error('Error updating action item:', error);
      toast.error("Failed to update action item");
    } finally {
      setUpdating('');
    }
  };

  // Create follow-up meeting with incomplete items
  const createFollowUpMeeting = async () => {
    if (!selectedMeeting) return;

    const incompleteItems = actionItems.filter(item => 
      item.completion_status !== 'completed' && item.completion_status !== 'cancelled'
    );

    if (incompleteItems.length === 0) {
      toast.info("All action items are completed. No follow-up needed.");
      return;
    }

    try {
      const response = await fetch('/api/meetings/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentMeetingId: selectedMeeting,
          incompleteItems: incompleteItems,
          createdBy: userId
        }),
      });

      if (response.ok) {
        toast.success("Follow-up meeting created successfully");
        onFollowUpUpdated();
      } else {
        throw new Error('Failed to create follow-up meeting');
      }
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error("Failed to create follow-up meeting");
    }
  };

  // Handle meeting selection
  const handleMeetingSelect = (meetingId: string) => {
    setSelectedMeeting(meetingId);
    fetchActionItems(meetingId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return due < today;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }
    return dateString;
  };

  const getActionItemStats = () => {
    const total = actionItems.length;
    const completed = actionItems.filter(item => item.completion_status === 'completed').length;
    const pending = actionItems.filter(item => item.completion_status === 'pending').length;
    const inProgress = actionItems.filter(item => item.completion_status === 'in_progress').length;
    const overdue = actionItems.filter(item => 
      item.completion_status !== 'completed' && 
      item.completion_status !== 'cancelled' &&
      isOverdue(item.due_date)
    ).length;

    return { total, completed, pending, inProgress, overdue };
  };

  const stats = getActionItemStats();

  return (
    <div className="space-y-6">
      {/* Meeting Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Meeting for Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedMeeting} onValueChange={handleMeetingSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a meeting to review" />
                </SelectTrigger>
                <SelectContent>
                  {availableMeetings.map((meeting) => (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{meeting.title}</span>
                        <div className="flex gap-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {formatDate(meeting.meeting_date)}
                          </Badge>
                          {meeting.action_items_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {meeting.completed_action_items}/{meeting.action_items_count} done
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => selectedMeeting && fetchActionItems(selectedMeeting)}
              disabled={!selectedMeeting}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {availableMeetings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meetings with action items found.</p>
              <p className="text-sm">Create meetings with action items to manage follow-ups.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items Stats */}
      {selectedMeeting && actionItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <CheckSquare size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-lg font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckSquare size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completed</p>
                  <p className="text-lg font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                  <p className="text-lg font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Clock size={16} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending</p>
                  <p className="text-lg font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertCircle size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                  <p className="text-lg font-bold">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Items List */}
      {selectedMeeting && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Action Items & Follow-up Tasks
              </CardTitle>
              {actionItems.some(item => 
                item.completion_status !== 'completed' && 
                item.completion_status !== 'cancelled'
              ) && (
                <Button onClick={createFollowUpMeeting} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Follow-up Meeting
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading action items...</p>
              </div>
            ) : actionItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No action items found for this meeting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionItems.map((item) => {
                  const overdue = isOverdue(item.due_date) && 
                    item.completion_status !== 'completed' && 
                    item.completion_status !== 'cancelled';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 border-l-4 rounded-lg bg-white shadow-sm ${getPriorityColor(item.priority)} ${
                        overdue ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.completion_status === 'completed'}
                          onCheckedChange={(checked) => {
                            if (updating === item.id) return;
                            updateActionItemStatus(
                              item.id,
                              checked ? 'completed' : 'pending'
                            );
                          }}
                          disabled={updating === item.id}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm ${
                              item.completion_status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {item.content}
                            </p>
                            
                            <div className="flex gap-2 flex-shrink-0 ml-4">
                              <Badge className={getStatusColor(item.completion_status)}>
                                {item.completion_status.replace('_', ' ')}
                              </Badge>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {item.assigned_to_name && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>Assigned to: {item.assigned_to_name}</span>
                              </div>
                            )}
                            
                            {item.due_date && (
                              <div className={`flex items-center gap-1 ${overdue ? 'text-red-600' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                <span>Due: {formatDate(item.due_date)}</span>
                              </div>
                            )}
                            
                            {item.priority && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>Priority: {item.priority}</span>
                              </div>
                            )}
                          </div>

                          {/* Progress Bar for In-Progress Items */}
                          {item.completion_status === 'in_progress' && item.completion_percentage !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${item.completion_percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {item.completion_percentage}%
                              </span>
                            </div>
                          )}

                          {/* Status Update Buttons */}
                          {item.completion_status !== 'completed' && item.completion_status !== 'cancelled' && (
                            <div className="flex gap-2">
                              {item.completion_status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateActionItemStatus(item.id, 'in_progress')}
                                  disabled={updating === item.id}
                                  className="text-xs h-7"
                                >
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  Start Progress
                                </Button>
                              )}
                              
                              {item.completion_status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateActionItemStatus(item.id, 'completed', 100)}
                                  disabled={updating === item.id}
                                  className="text-xs h-7"
                                >
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}