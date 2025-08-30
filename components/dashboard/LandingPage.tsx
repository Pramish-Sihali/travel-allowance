'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PageLayout from '@/components/layout/PageLayout';
import AttendancePanel from '@/components/attendance/AttendancePanel';
import CalendarOfTheDay from '@/components/dashboard/CalendarOfTheDay';
import FollowUpManager from '@/components/mom/FollowUpManager';
import UserTasksSection from '@/components/dashboard/UserTasksSection';
import EnhancedUserDashboard from '@/components/dashboard/EnhancedUserDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  status: string;
  action_items_count: number;
  completed_action_items: number;
}

interface LandingPageProps {
  userRole?: 'employee' | 'approver' | 'checker' | 'admin';
}

export default function LandingPage({ userRole = 'employee' }: LandingPageProps) {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [hasFollowUpTasks, setHasFollowUpTasks] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const params = new URLSearchParams({
        myMeetings: 'true',
        includeActionItems: 'true',
        page: '1',
        limit: '10'
      });
      
      const response = await fetch(`/api/meetings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        
        let meetingsData = [];
        // Handle new API response format
        if (data.success && data.data) {
          meetingsData = data.data.meetings || [];
        } else {
          // Fallback for old format
          meetingsData = data.meetings || data || [];
        }
        
        setMeetings(meetingsData);
        
        // Check if user has any follow-up tasks
        const hasActiveTasks = meetingsData.some((meeting: Meeting) => 
          (meeting.action_items_count || meeting.actualActionItemsCount || 0) > 0 && 
          meeting.status !== 'completed'
        );
        setHasFollowUpTasks(hasActiveTasks);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpUpdated = () => {
    fetchMeetings();
  };


  return (
    <PageLayout userRole={userRole}>
      {/* Welcome Section */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-lato mb-2">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {session?.user?.name || 'there'}!
        </h1>
        <p className="text-muted-foreground font-nunito text-sm md:text-base">
          Welcome to your IXI Employee Portal dashboard. Here's what's happening today.
        </p>
      </div>

            {/* Attendance Component */}
            {session?.user?.id && (
              <AttendancePanel 
                userId={session.user.id} 
                userName={session.user.name || 'User'} 
              />
            )}

            {/* Enhanced User Dashboard */}
            {session?.user?.id && (
              <EnhancedUserDashboard className="mb-6" />
            )}

            {/* Calendar of the Day Component */}
            <CalendarOfTheDay userId={session?.user?.id} />

            {/* Follow-Up Manager */}
            {!loading && hasFollowUpTasks && (
              <FollowUpManager 
                meetings={meetings} 
                onFollowUpUpdated={handleFollowUpUpdated}
                userId={session?.user?.id}
              />
            )}

            {loading && (
              <Card className="mb-6">
                <CardContent className="p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

      {/* Additional Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-primary mb-1">0</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pending Approvals</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                {meetings.reduce((sum, m) => sum + m.action_items_count, 0)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Total Action Items</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}