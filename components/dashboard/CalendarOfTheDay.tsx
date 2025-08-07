'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  location?: string;
  description?: string;
  type?: string;
}

interface CalendarOfTheDayProps {
  userId?: string;
}

export default function CalendarOfTheDay({ userId }: CalendarOfTheDayProps) {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayEvents();
  }, []);

  const fetchTodayEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/events?date=${today}`);
      if (response.ok) {
        const events = await response.json();
        setTodayEvents(events);
      }
    } catch (error) {
      console.error('Error fetching today\'s events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const getEventTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'holiday':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Today's Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Today's Events</span>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {todayFormatted}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events scheduled for today</p>
            <p className="text-xs text-muted-foreground/70">Enjoy your clear schedule!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
                    {event.type && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs shrink-0 ${getEventTypeColor(event.type)}`}
                      >
                        {event.type}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {todayEvents.length > 3 && (
              <div className="text-center pt-2">
                <button className="text-xs text-primary hover:text-primary/80 font-medium">
                  View all events for today →
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}