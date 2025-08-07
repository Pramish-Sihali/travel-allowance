'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Clock, 
  Calendar as CalendarIcon, 
  TrendingUp,
  BarChart3,
  Timer,
  Coffee,
  Target,
  Activity
} from 'lucide-react';
import TimerControls from '@/components/common/TimerControls';
import LogEntry from '@/components/common/LogEntry';

interface PersonalLog {
  id: string;
  userId: string;
  description: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  breakDuration: number;
  isPersonal: boolean;
  createdAt: string;
}

interface PersonalLogsSectionProps {
  className?: string;
}

export default function PersonalLogsSection({ className = "" }: PersonalLogsSectionProps) {
  const { data: session } = useSession();
  const [personalLogs, setPersonalLogs] = useState<PersonalLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<PersonalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [stats, setStats] = useState({
    totalTime: 0,
    totalBreakTime: 0,
    totalSessions: 0,
    averageSessionTime: 0,
    weeklyTotal: 0,
    monthlyTotal: 0
  });

  const userId = session?.user?.id;
  const userName = session?.user?.name;

  useEffect(() => {
    if (userId) {
      fetchPersonalLogs();
    }
  }, [userId]);

  useEffect(() => {
    filterLogsByDateRange();
    calculateStats();
  }, [personalLogs, dateRange, selectedDate]);

  const fetchPersonalLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/time-logs?userId=${userId}&personal=true`);
      if (response.ok) {
        const data = await response.json();
        setPersonalLogs(data);
      }
    } catch (error) {
      console.error('Error fetching personal logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogsByDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Get start of week (Sunday)
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        endDate = new Date(); // Now
        break;
    }

    const filtered = personalLogs.filter(log => {
      const logDate = new Date(log.startTime);
      return logDate >= startDate && logDate <= endDate;
    });

    setFilteredLogs(filtered);
  };

  const calculateStats = () => {
    const now = new Date();
    // Get start of week (Sunday)
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalTime = filteredLogs.reduce((sum, log) => sum + log.totalDuration, 0);
    const totalBreakTime = filteredLogs.reduce((sum, log) => sum + (log.breakDuration || 0), 0);
    const totalSessions = filteredLogs.length;
    const averageSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0;

    const weeklyLogs = personalLogs.filter(log => {
      const logDate = new Date(log.startTime);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    const weeklyTotal = weeklyLogs.reduce((sum, log) => sum + log.totalDuration, 0);

    const monthlyLogs = personalLogs.filter(log => {
      const logDate = new Date(log.startTime);
      return logDate >= monthStart;
    });
    const monthlyTotal = monthlyLogs.reduce((sum, log) => sum + log.totalDuration, 0);

    setStats({
      totalTime,
      totalBreakTime,
      totalSessions,
      averageSessionTime,
      weeklyTotal,
      monthlyTotal
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleTimerComplete = () => {
    fetchPersonalLogs(); // Refresh logs when new one is added
  };

  const groupLogsByDate = (logs: PersonalLog[]) => {
    const grouped: { [key: string]: PersonalLog[] } = {};
    
    logs.forEach(log => {
      const dateKey = new Date(log.startTime).toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
      .map(([date, logs]) => ({
        date,
        logs: logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      }));
  };

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-primary">{formatDuration(stats.weeklyTotal)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{formatDuration(stats.monthlyTotal)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold text-amber-600">{formatDuration(stats.averageSessionTime)}</p>
              </div>
              <Timer className="h-8 w-8 text-amber-600 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activity Logs
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Time Tracker
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Activity Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">View:</span>
                {(['today', 'week', 'month', 'all'] as const).map((range) => (
                  <Badge
                    key={range}
                    variant={dateRange === range ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setDateRange(range)}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Badge>
                ))}
                <Badge variant="outline" className="ml-2">
                  {filteredLogs.length} entries
                </Badge>
              </div>

              {/* Logs Display */}
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No personal logs found for this period</p>
                  <p className="text-xs">Use the time tracker to log your activities</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupLogsByDate(filteredLogs).map(({ date, logs }) => (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {logs.length} sessions
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatDuration(logs.reduce((sum, log) => sum + log.totalDuration, 0))} total
                        </Badge>
                      </div>
                      <div className="ml-6 space-y-2">
                        {logs.map((log) => (
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
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Timer Tab */}
            <TabsContent value="timer" className="space-y-4">
              <div className="max-w-md mx-auto">
                <TimerControls
                  isPersonal={true}
                  onTimerComplete={handleTimerComplete}
                />
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Analytics feature coming soon</p>
                <p className="text-xs">Detailed insights and charts will be available here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}