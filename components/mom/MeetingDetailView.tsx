'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Target,
  CheckSquare,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Building,
  ArrowRight,
  Edit,
  Play
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  meeting_time?: string;
  meeting_type: 'internal' | 'external';
  status: string;
  priority: string;
  assigned_to_name?: string;
  deadline_date?: string;
  location: string;
  location_type: string;
  task_title?: string;
  client_name?: string;
  client_company?: string;
  attendee_count: number;
  action_items_count: number;
  completed_action_items: number;
  created_at: string;
  updated_at: string;
}

interface MeetingDetails {
  meeting: Meeting;
  attendees: Array<{
    id: string;
    attendee_name: string;
    attendee_email?: string;
    attendee_organization?: string;
    attendee_type: 'internal' | 'external';
    attendance_status: string;
  }>;
  minutes: Array<{
    id: string;
    content: string;
    is_action_item: boolean;
    completion_status: string;
    assigned_to_name?: string;
    due_date?: string;
    priority?: string;
  }>;
  task?: {
    title: string;
    status: string;
  };
  client?: {
    name: string;
    company: string;
  };
}

interface MeetingDetailViewProps {
  meeting: Meeting;
  onMeetingUpdated: () => void;
  onStartFollowUp: () => void;
  userId?: string;
}

export default function MeetingDetailView({ 
  meeting, 
  onMeetingUpdated, 
  onStartFollowUp,
  userId 
}: MeetingDetailViewProps) {
  const { toast } = useToast();
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meeting.id]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meetings/${meeting.id}/details`);
      if (response.ok) {
        const data = await response.json();
        setMeetingDetails(data);
      } else {
        toast.error('Failed to load meeting details');
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      toast.error('Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }
    return dateString;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Time parsing error:', error);
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
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

  const getActionItemStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const markActionItemComplete = async (minuteId: string) => {
    try {
      const response = await fetch(`/api/meetings/action-items/${minuteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completion_status: 'completed',
          completed_by: userId,
          completed_at: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast.success('Action item marked as completed');
        fetchMeetingDetails();
        onMeetingUpdated();
      } else {
        toast.error('Failed to update action item');
      }
    } catch (error) {
      console.error('Error updating action item:', error);
      toast.error('Failed to update action item');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meeting details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!meetingDetails) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load meeting details.</p>
          <Button onClick={fetchMeetingDetails} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasActionItems = meetingDetails.minutes.some(minute => minute.is_action_item);
  const completedActionItems = meetingDetails.minutes.filter(
    minute => minute.is_action_item && minute.completion_status === 'completed'
  ).length;
  const totalActionItems = meetingDetails.minutes.filter(minute => minute.is_action_item).length;

  return (
    <div className="space-y-6">
      {/* Meeting Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{meeting.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(meeting.status)}>
                  {meeting.status}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(meeting.priority)}>
                  {meeting.priority} priority
                </Badge>
                <Badge variant="outline">
                  {meeting.meeting_type} meeting
                </Badge>
              </div>
            </div>
            {hasActionItems && (
              <Button onClick={onStartFollowUp} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Manage Follow-ups
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Time */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{formatDate(meeting.meeting_date)}</span>
            {meeting.meeting_time && (
              <>
                <Clock className="h-5 w-5 text-muted-foreground ml-4" />
                <span>{formatTime(meeting.meeting_time)}</span>
              </>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="capitalize font-medium">{meeting.location_type}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{meeting.location}</span>
          </div>

          {/* Task Connection */}
          {meetingDetails.task && (
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Related Task:</span>
              <span>{meetingDetails.task.title}</span>
              <Badge variant="outline" className="ml-2">
                {meetingDetails.task.status}
              </Badge>
            </div>
          )}

          {/* Client Information */}
          {meetingDetails.client && (
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Client:</span>
              <span>{meetingDetails.client.name}</span>
              {meetingDetails.client.company && (
                <span className="text-muted-foreground">({meetingDetails.client.company})</span>
              )}
            </div>
          )}

          {/* Assignment */}
          {meeting.assigned_to_name && (
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Assigned to:</span>
              <span>{meeting.assigned_to_name}</span>
            </div>
          )}

          {/* Deadline */}
          {meeting.deadline_date && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Deadline:</span>
              <span>{formatDate(meeting.deadline_date)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendees ({meetingDetails.attendees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetingDetails.attendees.map((attendee, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 rounded-full bg-white">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{attendee.attendee_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {attendee.attendee_type}
                    </Badge>
                  </div>
                  {attendee.attendee_email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{attendee.attendee_email}</span>
                    </div>
                  )}
                  {attendee.attendee_organization && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{attendee.attendee_organization}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Minutes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meeting Minutes & Action Items
            </CardTitle>
            {hasActionItems && (
              <div className="text-sm text-muted-foreground">
                {completedActionItems}/{totalActionItems} action items completed
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetingDetails.minutes.map((minute, index) => (
              <div
                key={minute.id}
                className={`p-4 rounded-lg border-l-4 ${
                  minute.is_action_item
                    ? 'border-l-blue-500 bg-blue-50'
                    : 'border-l-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {minute.is_action_item ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium text-muted-foreground">
                        {minute.is_action_item ? 'Action Item' : 'Minute'} #{index + 1}
                      </span>
                      {minute.is_action_item && (
                        <Badge className={getActionItemStatusColor(minute.completion_status)}>
                          {minute.completion_status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`mb-3 ${
                      minute.is_action_item && minute.completion_status === 'completed' 
                        ? 'line-through text-muted-foreground' 
                        : ''
                    }`}>
                      {minute.content}
                    </p>

                    {minute.is_action_item && (
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {minute.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>Assigned to: {minute.assigned_to_name}</span>
                          </div>
                        )}
                        {minute.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(minute.due_date)}</span>
                          </div>
                        )}
                        {minute.priority && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Priority: {minute.priority}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {minute.is_action_item && minute.completion_status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markActionItemComplete(minute.id)}
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}