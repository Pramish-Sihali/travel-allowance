'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  RefreshCw,
  Target
} from 'lucide-react';
import MeetingMinutesTable from './MeetingMinutesTable';

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  status: string;
  action_items_count: number;
  completed_action_items: number;
}

interface MeetingMinute {
  id?: string;
  serialNo: number;
  responsibility: string;
  assignedToId: string;
  assignedToName: string;
  deadline: string;
  remarks: string;
  isDone: boolean;
  flags: string;
  toggledBy?: string;
  toggledAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface MeetingWithActionItems {
  meeting: Meeting;
  actionItems: MeetingMinute[];
}

interface FollowUpManagerProps {
  meetings: Meeting[];
  onFollowUpUpdated: () => void;
  userId?: string;
}

export default function FollowUpManager({ meetings, onFollowUpUpdated, userId }: FollowUpManagerProps) {
  const { toast } = useToast();
  const [meetingsWithActionItems, setMeetingsWithActionItems] = useState<MeetingWithActionItems[]>([]);
  const [loading, setLoading] = useState(false);

  // Get meetings that have action items
  const availableMeetings = meetings.filter(meeting => 
    meeting.action_items_count > 0 || meeting.status === 'completed'
  );

  // Fetch action items for all meetings automatically
  const fetchAllActionItems = async () => {
    if (availableMeetings.length === 0) return;

    setLoading(true);
    try {
      const meetingsData: MeetingWithActionItems[] = [];
      
      for (const meeting of availableMeetings) {
        const response = await fetch(`/api/meetings/${meeting.id}/action-items`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const actionItems = convertActionItemsToTableFormat(data.actionItems || [], meeting);
          
          // Always add the meeting to show it in the interface, even if no action items
          meetingsData.push({
            meeting,
            actionItems
          });
        }
      }
      
      setMeetingsWithActionItems(meetingsData);
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast.error("Failed to load action items");
    } finally {
      setLoading(false);
    }
  };

  // Convert API action items to table format
  const convertActionItemsToTableFormat = (actionItems: any[], meeting: Meeting): MeetingMinute[] => {
    return actionItems.map((item: any, index: number) => ({
      id: item.id,
      serialNo: item.serial_no || (index + 1),
      responsibility: item.responsibility || item.content,
      assignedToId: item.assigned_to || '',
      assignedToName: item.assigned_to_name || '',
      deadline: item.due_date || '',
      remarks: item.remarks || item.deadline_notes || '',
      isDone: item.is_done !== undefined ? item.is_done : (item.completion_status === 'completed'),
      flags: item.flags || (item.priority ? `Priority: ${item.priority}` : ''),
      toggledBy: item.toggled_by || item.completed_by_name,
      toggledAt: item.toggled_at || item.completed_at,
      createdBy: item.created_by_name,
      updatedBy: item.updated_by_name,
    }));
  };

  // Update action item status via the table
  const handleActionItemUpdate = async (meetingId: string, updatedItems: MeetingMinute[]) => {
    const currentMeeting = meetingsWithActionItems.find(m => m.meeting.id === meetingId);
    if (!currentMeeting) return;

    // Find which item was updated by comparing arrays
    for (let i = 0; i < updatedItems.length; i++) {
      const updatedItem = updatedItems[i];
      const currentItem = currentMeeting.actionItems[i];
      
      if (currentItem && updatedItem.isDone !== currentItem.isDone) {
        // This item's status was toggled - update it in the database
        try {
          const response = await fetch(`/api/meetings/action-items/${updatedItem.id}`, {
            method: 'PATCH',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              is_done: updatedItem.isDone,
              toggled_by: userId || 'Follow-up Manager',
              toggled_at: new Date().toISOString(),
              completion_status: updatedItem.isDone ? 'completed' : 'pending',
              completion_percentage: updatedItem.isDone ? 100 : 0,
              completed_at: updatedItem.isDone ? new Date().toISOString() : null,
              completed_by_name: updatedItem.isDone ? (userId || 'Follow-up Manager') : null,
            }),
          });

          if (response.ok) {
            // Update local state with the change
            setMeetingsWithActionItems(prev => 
              prev.map(meetingData => 
                meetingData.meeting.id === meetingId 
                  ? { ...meetingData, actionItems: updatedItems }
                  : meetingData
              )
            );

            toast.success(`Action item marked as ${updatedItem.isDone ? 'Done' : 'Not Done'}`);
            onFollowUpUpdated();
          } else {
            toast.error("Failed to update action item status");
          }
        } catch (error) {
          console.error('Error updating action item:', error);
          toast.error("Failed to update action item status");
        }
        break; // Only handle one change at a time
      }
    }
  };

  // Load data on component mount and when meetings change
  useEffect(() => {
    fetchAllActionItems();
  }, [meetings]);

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

  // Calculate overall stats across all meetings
  const getOverallStats = () => {
    const allActionItems = meetingsWithActionItems.flatMap(m => m.actionItems);
    const total = allActionItems.length;
    const completed = allActionItems.filter(item => item.isDone).length;
    const pending = total - completed;

    return { total, completed, pending };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Follow-up Manager
            </CardTitle>
            <Button
              onClick={fetchAllActionItems}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-l-4 border-l-gray-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100">
                      <CheckSquare size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Action Items</p>
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
            </div>
          )}

          {availableMeetings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meetings with action items found.</p>
              <p className="text-sm">Create meetings with action items to manage follow-ups.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading action items...</p>
          </CardContent>
        </Card>
      )}

      {/* Meetings with Action Items */}
      {!loading && meetingsWithActionItems.map((meetingData) => (
        <Card key={meetingData.meeting.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {meetingData.meeting.title}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {formatDate(meetingData.meeting.meeting_date)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {meetingData.actionItems.filter(item => item.isDone).length}/{meetingData.actionItems.length} completed
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MeetingMinutesTable
              meetingMinutes={meetingData.actionItems}
              onMinutesChange={(updatedItems) => handleActionItemUpdate(meetingData.meeting.id, updatedItems)}
              isReadOnly={false}
              currentUserId={userId}
              currentUserName="Follow-up Manager"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}