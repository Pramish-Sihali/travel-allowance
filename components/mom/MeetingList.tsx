'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  AlertCircle,
  CheckSquare,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react';
import MeetingDetailView from './MeetingDetailView';
// Using built-in Date functions instead of date-fns

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

interface MeetingListProps {
  meetings: Meeting[];
  loading: boolean;
  onMeetingUpdated: () => void;
  onRefresh: () => void;
}

export default function MeetingList({ meetings, loading, onMeetingUpdated, onRefresh }: MeetingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Filter and sort meetings
  const filteredMeetings = meetings
    .filter(meeting => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          meeting.title.toLowerCase().includes(searchLower) ||
          meeting.location.toLowerCase().includes(searchLower) ||
          meeting.assigned_to_name?.toLowerCase().includes(searchLower) ||
          meeting.client_name?.toLowerCase().includes(searchLower) ||
          meeting.task_title?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(meeting => {
      // Status filter
      if (statusFilter !== 'all') {
        return meeting.status === statusFilter;
      }
      return true;
    })
    .filter(meeting => {
      // Type filter
      if (typeFilter !== 'all') {
        return meeting.meeting_type === typeFilter;
      }
      return true;
    })
    .filter(meeting => {
      // Priority filter
      if (priorityFilter !== 'all') {
        return meeting.priority === priorityFilter;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime();
        case 'date_desc':
          return new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        default:
          return 0;
      }
    });

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

  const getActionItemsProgress = (meeting: Meeting) => {
    if (meeting.action_items_count === 0) return null;
    const percentage = Math.round((meeting.completed_action_items / meeting.action_items_count) * 100);
    return { percentage, completed: meeting.completed_action_items, total: meeting.action_items_count };
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      // Handle both HH:mm and HH:mm:ss formats
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

  const isOverdue = (meeting: Meeting) => {
    if (!meeting.deadline_date || meeting.status === 'completed') return false;
    const deadlineDate = new Date(meeting.deadline_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return deadlineDate < today;
  };

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowDetailView(true);
  };

  const handleCloseDetailView = () => {
    setSelectedMeeting(null);
    setShowDetailView(false);
  };

  const handleFollowUp = () => {
    // This could trigger follow-up functionality if needed
    console.log('Follow-up functionality');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meetings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Meetings
            </CardTitle>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Date (Newest)</SelectItem>
                <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters Summary */}
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary">Search: "{searchTerm}"</Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary">Status: {statusFilter}</Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary">Type: {typeFilter}</Badge>
              )}
              {priorityFilter !== 'all' && (
                <Badge variant="secondary">Priority: {priorityFilter}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                }}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredMeetings.length} of {meetings.length} meetings
      </div>

      {/* Meeting Cards */}
      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No meetings found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No meetings have been created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMeetings.map((meeting) => {
            const actionProgress = getActionItemsProgress(meeting);
            const overdue = isOverdue(meeting);

            return (
              <Card key={meeting.id} className={`relative ${overdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                {overdue && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-lg leading-tight">
                        {meeting.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(meeting.priority)}>
                          {meeting.priority}
                        </Badge>
                        <Badge variant="outline">
                          {meeting.meeting_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Date and Time */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(meeting.meeting_date)}</span>
                    {meeting.meeting_time && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{formatTime(meeting.meeting_time)}</span>
                      </>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{meeting.location_type}</span>
                    {meeting.location && (
                      <span className="text-muted-foreground">
                        - {meeting.location.length > 50 
                          ? `${meeting.location.substring(0, 50)}...` 
                          : meeting.location}
                      </span>
                    )}
                  </div>

                  {/* Task/Client */}
                  {meeting.task_title && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Task:</span>
                      <span>{meeting.task_title}</span>
                    </div>
                  )}

                  {meeting.client_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Client:</span>
                      <span>{meeting.client_name}</span>
                      {meeting.client_company && (
                        <span className="text-muted-foreground">({meeting.client_company})</span>
                      )}
                    </div>
                  )}

                  {/* Assignment */}
                  {meeting.assigned_to_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned to:</span>
                      <span>{meeting.assigned_to_name}</span>
                    </div>
                  )}

                  {/* Deadline */}
                  {meeting.deadline_date && (
                    <div className={`flex items-center gap-2 text-sm ${overdue ? 'text-red-600' : ''}`}>
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{formatDate(meeting.deadline_date)}</span>
                    </div>
                  )}

                  {/* Attendees and Action Items */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendee_count} attendees</span>
                      </div>
                      
                      {meeting.action_items_count > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4" />
                          <span>{meeting.action_items_count} action items</span>
                        </div>
                      )}
                    </div>

                    {/* Action Items Progress */}
                    {actionProgress && (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {actionProgress.completed}/{actionProgress.total}
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${actionProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewDetails(meeting)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meeting Detail View Modal/Overlay */}
      {showDetailView && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Meeting Details</h2>
              <Button variant="outline" size="sm" onClick={handleCloseDetailView}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <MeetingDetailView
                meeting={selectedMeeting}
                onMeetingUpdated={() => {
                  onMeetingUpdated();
                  handleCloseDetailView();
                }}
                onStartFollowUp={handleFollowUp}
                userId={selectedMeeting.assigned_to_name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}