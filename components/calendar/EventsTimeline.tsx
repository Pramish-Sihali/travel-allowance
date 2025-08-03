'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event, EventType } from '@/types';

interface EventsTimelineProps {
  selectedDate?: Date | null;
  events: Event[];
  onEventClick?: (event: Event) => void;
}

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  company_meeting: 'bg-blue-100 text-blue-800 border-blue-200',
  hall_booking: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  potluck: 'bg-pink-100 text-pink-800 border-pink-200',
  training: 'bg-green-100 text-green-800 border-green-200',
  holiday: 'bg-red-100 text-red-800 border-red-200',
  deadline: 'bg-orange-100 text-orange-800 border-orange-200',
  announcement: 'bg-purple-100 text-purple-800 border-purple-200',
  birthday: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  team_outing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  workshop: 'bg-teal-100 text-teal-800 border-teal-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function EventsTimeline({ selectedDate, events, onEventClick }: EventsTimelineProps) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (selectedDate) {
      // Filter events for the selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.startDate).toISOString().split('T')[0];
        const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
        return dateStr >= eventStart && dateStr <= eventEnd;
      });

      // Sort events by time (all-day events first, then by start time)
      const sortedEvents = dayEvents.sort((a, b) => {
        // All-day events come first
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        if (a.isAllDay && b.isAllDay) return 0;

        // Sort by start time for non-all-day events
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });

      setFilteredEvents(sortedEvents);
    } else {
      // Show upcoming events if no specific date is selected
      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = events
        .filter(event => {
          const eventStart = new Date(event.startDate).toISOString().split('T')[0];
          return eventStart >= today;
        })
        .sort((a, b) => {
          const dateCompare = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          if (dateCompare !== 0) return dateCompare;
          
          // Same date, sort by time
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return 0;
        })
        .slice(0, 10); // Show only next 10 events

      setFilteredEvents(upcomingEvents);
    }
  }, [selectedDate, events]);

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (filteredEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {selectedDate ? `Events for ${formatDate(selectedDate.toISOString())}` : 'Upcoming Events'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {selectedDate ? `Events for ${formatDate(selectedDate.toISOString())}` : 'Upcoming Events'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline connector */}
              {index < filteredEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-border z-0" />
              )}
              
              <div className="flex gap-4">
                {/* Time indicator */}
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {event.isAllDay ? (
                      <span className="font-medium">All Day</span>
                    ) : event.startTime ? (
                      <>
                        <div className="font-medium">{formatTime(event.startTime)}</div>
                        {event.endTime && (
                          <div className="text-[10px]">to {formatTime(event.endTime)}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px]">No time</span>
                    )}
                  </div>
                </div>

                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${EVENT_TYPE_COLORS[event.eventType]}`}
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {event.eventType.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {event.maxAttendees && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.currentAttendees || 0}/{event.maxAttendees}</span>
                        </div>
                      )}
                      
                      {event.createdByName && (
                        <div className="text-xs">
                          by {event.createdByName}
                        </div>
                      )}
                    </div>

                    {/* Show date if it's different from selected date */}
                    {!selectedDate && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        📅 {formatDate(event.startDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}