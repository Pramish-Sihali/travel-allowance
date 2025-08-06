'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EventForm } from './EventForm';
import { HallBookingForm } from './HallBookingForm';
import { EventsTimeline } from './EventsTimeline';
import { Event, EventType } from '@/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export default function CompanyCalendar() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showHallBookingForm, setShowHallBookingForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isApprover = session?.user?.role === 'approver';
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (day: number) => {
    if (!day) return [];
    
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const handleEventSaved = () => {
    fetchEvents();
    setShowEventForm(false);
    setShowHallBookingForm(false);
    setSelectedEvent(null);
  };

  const handleEventEdit = (event: Event) => {
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  const handleDateClick = (day: number) => {
    if (day) {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(clickedDate);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Company Calendar
            </CardTitle>
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowHallBookingForm(true)}>
                    <Building className="h-4 w-4 mr-2" />
                    Quick Hall Booking
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowEventForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Custom Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {DAYS.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const currentDateForDay = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
              const isToday = day && 
                new Date().toDateString() === currentDateForDay?.toDateString();
              const isSelected = day && selectedDate &&
                selectedDate.toDateString() === currentDateForDay?.toDateString();
              const isWeekend = currentDateForDay && (currentDateForDay.getDay() === 0 || currentDateForDay.getDay() === 6); // Sunday = 0, Saturday = 6

              return (
                <div
                  key={index}
                  onClick={() => day && handleDateClick(day)}
                  className={`
                    min-h-24 p-1 border border-border/50 cursor-pointer
                    ${day ? 'bg-background hover:bg-muted/50' : 'bg-muted/20 cursor-default'}
                    ${isToday ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-200' : ''}
                    ${isSelected && !isToday ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : ''}
                    ${isWeekend && !isToday && !isSelected ? 'bg-red-50 border-red-200' : ''}
                  `}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => {
                          const formatTime = (time: string) => {
                            return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                          };

                          const timeDisplay = event.isAllDay 
                            ? 'All Day' 
                            : event.startTime 
                              ? (event.endTime ? `${formatTime(event.startTime)}-${formatTime(event.endTime)}` : formatTime(event.startTime))
                              : '';

                          return (
                            <div
                              key={event.id}
                              onClick={() => isAuthenticated && handleEventEdit(event)}
                              className={`
                                text-xs p-1 rounded cursor-pointer
                                ${EVENT_TYPE_COLORS[event.eventType]}
                                ${isAuthenticated ? 'hover:opacity-80' : ''}
                              `}
                              title={`${event.title}${timeDisplay ? '\nTime: ' + timeDisplay : ''}${event.description ? '\n' + event.description : ''}${event.location ? '\nLocation: ' + event.location : ''}${event.createdByName ? '\nCreated by: ' + event.createdByName : ''}${event.eventType === 'hall_booking' && event.maxAttendees ? '\nCapacity: ' + event.maxAttendees + ' people' : ''}`}
                            >
                              <div className="font-medium">
                                {event.title.length > 13 ? event.title.substring(0, 13) + '...' : event.title}
                              </div>
                              {timeDisplay && (
                                <div className="text-[10px] opacity-75 mt-0.5">
                                  {timeDisplay.length > 15 ? timeDisplay.substring(0, 15) + '...' : timeDisplay}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Event Legend */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Event Types</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
                <Badge key={type} className={color} variant="outline">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
        </div>

        {/* Timeline Column */}
        <div className="lg:col-span-1">
          <EventsTimeline 
            selectedDate={selectedDate} 
            events={events} 
            onEventClick={handleEventEdit}
          />
        </div>
      </div>

      {/* Event Form Modal */}
      <EventForm
        event={selectedEvent}
        open={showEventForm}
        onSave={handleEventSaved}
        onCancel={() => {
          setShowEventForm(false);
          setSelectedEvent(null);
        }}
      />

      {/* Hall Booking Form Modal */}
      <HallBookingForm
        open={showHallBookingForm}
        onSave={handleEventSaved}
        onCancel={() => setShowHallBookingForm(false)}
      />
    </div>
  );
}