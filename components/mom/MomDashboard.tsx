'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Plus,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Target,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateMeetingForm from './CreateMeetingForm';
import MeetingDetailView from './MeetingDetailView';
import FollowUpManager from './FollowUpManager';

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

interface MoMStats {
  totalMeetings: number;
  scheduledMeetings: number;
  completedMeetings: number;
  pendingActionItems: number;
  overdueMeetings: number;
  upcomingDeadlines: number;
}

export default function MomDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MoMStats>({
    totalMeetings: 0,
    scheduledMeetings: 0,
    completedMeetings: 0,
    pendingActionItems: 0,
    overdueMeetings: 0,
    upcomingDeadlines: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view' | 'edit' | 'followup'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch meetings and statistics
  const fetchMeetingsData = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/meetings?employeeId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingsData();
  }, [session]);

  const handleMeetingCreated = () => {
    // Refresh data when a new meeting is created
    fetchMeetingsData();
    // Return to meetings list
    setViewMode('list');
    setShowCreateForm(false);
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setViewMode('view');
  };

  const handleEditMeeting = () => {
    setViewMode('edit');
  };

  const handleMeetingUpdated = () => {
    // Refresh data when a meeting is updated
    fetchMeetingsData();
    // Return to view mode
    setViewMode('view');
  };


  const handleBackToList = () => {
    setViewMode('list');
    setSelectedMeeting(null);
    setShowCreateForm(false);
  };

  // Filter meetings
  const filteredMeetings = meetings
    .filter(meeting => {
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
      if (statusFilter !== 'all') {
        return meeting.status === statusFilter;
      }
      return true;
    })
    .filter(meeting => {
      if (typeFilter !== 'all') {
        return meeting.meeting_type === typeFilter;
      }
      return true;
    })
    .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());

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

  const isOverdue = (meeting: Meeting) => {
    if (!meeting.deadline_date || meeting.status === 'completed') return false;
    const deadlineDate = new Date(meeting.deadline_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return deadlineDate < today;
  };

  const getActionItemsProgress = (meeting: Meeting) => {
    if (meeting.action_items_count === 0) return null;
    const percentage = Math.round((meeting.completed_action_items / meeting.action_items_count) * 100);
    return { percentage, completed: meeting.completed_action_items, total: meeting.action_items_count };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading meetings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show create form
  if (showCreateForm || viewMode === 'create') {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Meeting</h1>
            <p className="text-muted-foreground mt-1">Add a new meeting with minutes and action items</p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        </div>
        
        <CreateMeetingForm 
          onMeetingCreated={handleMeetingCreated}
          userId={session?.user?.id}
          userName={session?.user?.name || undefined}
        />
      </div>
    );
  }

  // Show meeting detail view
  if (viewMode === 'view' && selectedMeeting) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meeting Details</h1>
            <p className="text-muted-foreground mt-1">{selectedMeeting.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Meetings
            </Button>
          </div>
        </div>
        
        <MeetingDetailView 
          meeting={selectedMeeting}
          onMeetingUpdated={() => {
            fetchMeetingsData();
            // Update the selected meeting with fresh data
            const updatedMeeting = meetings.find(m => m.id === selectedMeeting.id);
            if (updatedMeeting) {
              setSelectedMeeting(updatedMeeting);
            }
          }}
          onStartFollowUp={() => {
            setViewMode('followup');
          }}
          onEditMeeting={handleEditMeeting}
          userId={session?.user?.id}
        />
      </div>
    );
  }

  // Show edit meeting form
  if (viewMode === 'edit' && selectedMeeting) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Meeting</h1>
            <p className="text-muted-foreground mt-1">Modify meeting details and action items: {selectedMeeting.title}</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('view')}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Meeting
          </Button>
        </div>
        
        <CreateMeetingForm 
          onMeetingCreated={handleMeetingUpdated}
          userId={session?.user?.id}
          userName={session?.user?.name || undefined}
          editMode={true}
          existingMeeting={selectedMeeting}
        />
      </div>
    );
  }

  // Show follow-up manager
  if (viewMode === 'followup' && selectedMeeting) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Follow-up Manager</h1>
            <p className="text-muted-foreground mt-1">Manage action items for: {selectedMeeting.title}</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('view')}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Meeting
          </Button>
        </div>
        
        <FollowUpManager 
          meetings={[selectedMeeting]}
          onFollowUpUpdated={() => {
            fetchMeetingsData();
          }}
          userId={session?.user?.id}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minutes of Meeting</h1>
          <p className="text-muted-foreground mt-1">Manage your meetings, minutes, and follow-up actions</p>
        </div>
        <Button onClick={() => setViewMode('create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Meeting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-lg font-bold">{stats.totalMeetings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <Clock size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Scheduled</p>
                <p className="text-lg font-bold">{stats.scheduledMeetings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckSquare size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                <p className="text-lg font-bold">{stats.completedMeetings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Target size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Actions</p>
                <p className="text-lg font-bold">{stats.pendingActionItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertCircle size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                <p className="text-lg font-bold">{stats.overdueMeetings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Calendar size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Due Soon</p>
                <p className="text-lg font-bold">{stats.upcomingDeadlines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      {meetings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Meetings
              </CardTitle>
              <Button onClick={fetchMeetingsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

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
                </SelectContent>
              </Select>

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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">No meetings yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating your first meeting with minutes and action items to track your team's progress.
            </p>
            <Button onClick={() => setViewMode('create')} size="lg" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredMeetings.length} of {meetings.length} meetings
          </div>
          
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
                        <Target className="h-4 w-4 text-muted-foreground" />
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
                        onClick={() => handleViewMeeting(meeting)}
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
        </>
      )}
    </div>
  );
}