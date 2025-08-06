'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Plus,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';

import CreateMeetingForm from './CreateMeetingForm';
import MeetingList from './MeetingList';
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

export default function MinutesOfMeeting() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('create');
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
    // Switch to meetings list tab
    setActiveTab('meetings');
  };

  const handleMeetingUpdated = () => {
    // Refresh data when a meeting is updated
    fetchMeetingsData();
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
                <Users size={16} className="text-purple-600" />
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

      {/* Main MoM Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Minutes of Meeting (MoM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Meeting
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting List
                {meetings.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {meetings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="followups" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Follow-ups
                {stats.pendingActionItems > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pendingActionItems}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <CreateMeetingForm 
                onMeetingCreated={handleMeetingCreated}
                userId={session?.user?.id}
                userName={session?.user?.name || undefined}
              />
            </TabsContent>

            <TabsContent value="meetings" className="mt-6">
              <MeetingList 
                meetings={meetings}
                loading={loading}
                onMeetingUpdated={handleMeetingUpdated}
                onRefresh={fetchMeetingsData}
              />
            </TabsContent>

            <TabsContent value="followups" className="mt-6">
              <FollowUpManager 
                meetings={meetings}
                onFollowUpUpdated={handleMeetingUpdated}
                userId={session?.user?.id}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}