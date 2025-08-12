'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckSquare, 
  Clock, 
  User, 
  Calendar,
  Plus,
  Timer,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import ProjectCard from '@/components/common/ProjectCard';
import TimerControls from '@/components/common/TimerControls';
import ProjectTimeTracker from '@/components/common/ProjectTimeTracker';
import LogEntry from '@/components/common/LogEntry';
import ActionItemsSection from '@/components/dashboard/ActionItemsSection';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  departmentName?: string;
  assignedTo: string[];
  ragStatus: 'Red' | 'Amber' | 'Green' | 'Unrated';
  progress?: number;
  actionItems?: ActionItem[];
  createdAt: string;
  updatedAt?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface TimeLog {
  id: string;
  taskId?: string;
  userId: string;
  description: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  breakDuration: number;
  isPersonal: boolean;
  taskTitle?: string;
}

interface EnhancedUserDashboardProps {
  className?: string;
}

export default function EnhancedUserDashboard({ className = "" }: EnhancedUserDashboardProps) {
  const { data: session } = useSession();
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<TimeLog[]>([]);
  const [personalLogs, setPersonalLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  const userId = session?.user?.id;
  const userName = session?.user?.name;

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchActiveProjects(),
        fetchTodaysLogs(),
        fetchPersonalLogs()
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProjects = async () => {
    try {
      const response = await fetch(`/api/tasks?assignedTo=${userId}&status=active`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only show projects assigned to this user that are not completed
        const userProjects = data.filter((project: Project) => 
          project.status !== 'Completed' && project.status !== 'Cancelled' &&
          (project.assignedTo && Array.isArray(project.assignedTo) ? 
            project.assignedTo.some(assignee => 
              assignee.toLowerCase().includes(userName?.toLowerCase() || '') ||
              assignee.includes(userId || '')
            ) : false
          )
        );
        setActiveProjects(userProjects);
      }
    } catch (error) {
      console.error('Error fetching active projects:', error);
    }
  };

  const fetchTodaysLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/time-logs?userId=${userId}&date=${today}&personal=false`);
      if (response.ok) {
        const data = await response.json();
        setTodaysLogs(data);
      }
    } catch (error) {
      console.error('Error fetching today\'s logs:', error);
    }
  };

  const fetchPersonalLogs = async () => {
    try {
      const response = await fetch(`/api/time-logs?userId=${userId}&personal=true&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setPersonalLogs(data);
      }
    } catch (error) {
      console.error('Error fetching personal logs:', error);
    }
  };

  const handleTimerComplete = (timeLog: any) => {
    // Refresh today's logs when a timer is completed
    fetchTodaysLogs();
    if (timeLog.isPersonal) {
      fetchPersonalLogs();
    }
  };

  const getTodayStats = () => {
    const totalDuration = todaysLogs.reduce((sum, log) => sum + log.totalDuration, 0);
    const totalBreakTime = todaysLogs.reduce((sum, log) => sum + (log.breakDuration || 0), 0);
    const activeTime = totalDuration - totalBreakTime;
    const logsCount = todaysLogs.length;

    return {
      totalDuration,
      activeTime,
      totalBreakTime,
      logsCount
    };
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = getTodayStats();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Action Items Section - Show prominently at the top */}
      <ActionItemsSection />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-primary">{activeProjects.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Work</p>
                <p className="text-2xl font-bold text-blue-600">{formatDuration(stats.activeTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.logsCount}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Break Time</p>
                <p className="text-2xl font-bold text-amber-600">{formatDuration(stats.totalBreakTime)}</p>
              </div>
              <Timer className="h-8 w-8 text-amber-600 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Project Details
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracker
              </TabsTrigger>
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Log
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Logs
              </TabsTrigger>
            </TabsList>

            {/* Project Details Tab */}
            <TabsContent value="projects" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Active Projects</h3>
                <Link href="/tasks">
                  <Button variant="outline" size="sm">
                    View All Projects
                  </Button>
                </Link>
              </div>
              
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No active projects assigned to you</p>
                  <p className="text-xs">Projects assigned to you will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.slice(0, 3).map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentUserId={userId}
                      currentUserName={userName || undefined}
                      showTimer={true}
                      compact={true}
                    />
                  ))}
                  {activeProjects.length > 3 && (
                    <div className="text-center">
                      <Link href="/tasks">
                        <Button variant="outline" size="sm">
                          View {activeProjects.length - 3} more projects →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Time Tracker Tab */}
            <TabsContent value="timer" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Time Tracker</h3>
                  <ProjectTimeTracker
                    onTimerComplete={handleTimerComplete}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Activity Logger</h3>
                  <TimerControls
                    isPersonal={true}
                    onTimerComplete={handleTimerComplete}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Today's Log Tab */}
            <TabsContent value="today" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Today's Work Log</h3>
                <Badge variant="outline">
                  {todaysLogs.length} sessions
                </Badge>
              </div>

              {todaysLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No work logged today</p>
                  <p className="text-xs">Start a timer to track your work</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysLogs.map((log) => (
                    <LogEntry
                      key={log.id}
                      log={{
                        id: log.id,
                        projectId: log.taskId,
                        userId: log.userId,
                        userName: userName || 'You',
                        description: log.description,
                        timestamp: log.endTime,
                        duration: log.totalDuration,
                        breakDuration: log.breakDuration,
                        type: 'time_log',
                        metadata: {
                          taskTitle: log.taskTitle
                        }
                      }}
                      compact={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Personal Logs Tab */}
            <TabsContent value="personal" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personal Activity Logs</h3>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    View Full History
                  </Button>
                </Link>
              </div>

              {personalLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No personal logs yet</p>
                  <p className="text-xs">Use the personal timer to track your activities</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personalLogs.map((log) => (
                    <LogEntry
                      key={log.id}
                      log={{
                        id: log.id,
                        userId: log.userId,
                        userName: userName || 'You',
                        description: log.description,
                        timestamp: log.endTime,
                        duration: log.totalDuration,
                        breakDuration: log.breakDuration,
                        type: 'personal'
                      }}
                      compact={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}