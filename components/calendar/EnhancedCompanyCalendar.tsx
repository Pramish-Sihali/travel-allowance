'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2
} from 'lucide-react';
// Calendar event interface matching API response
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  eventType?: string;
  location?: string;
  hallId?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  maxAttendees?: number;
  currentAttendees?: number;
  requiresApproval?: boolean;
  approvalStatus?: string;
  createdAt: string;
  updatedAt: string;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EnhancedCompanyCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: 'meeting',
    isAllDay: false
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      eventType: 'meeting',
      isAllDay: false
    });
    setIsEventDialogOpen(true);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      eventType: event.eventType || 'meeting',
      isAllDay: event.isAllDay || false
    });
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!selectedDate && !editingEvent) return;

    const eventDate = editingEvent ? 
      events.find(e => e.id === editingEvent.id)?.startDate :
      selectedDate!.toISOString().split('T')[0];

    const eventData = {
      ...eventForm,
      startDate: eventDate,
      endDate: eventDate, // For single-day events
    };

    try {
      const response = editingEvent ? 
        await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        }) :
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });

      if (response.ok) {
        toast.success(editingEvent ? 'Event updated successfully' : 'Event created successfully');
        setIsEventDialogOpen(false);
        fetchEvents();
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error("Failed to save event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        fetchEvents();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error("Failed to delete event");
    }
  };

  const getEventsForDay = (day: number) => {
    const dayStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    
    return events.filter(event => {
      return event.startDate === dayStr;
    });
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'holiday':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'company_meeting':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'announcement':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-1" />);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().toDateString() === 
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square p-1 border border-border/20 cursor-pointer hover:bg-muted/50 transition-colors ${
            isToday ? 'bg-primary/10 ring-2 ring-primary/20' : ''
          }`}
          onClick={() => handleDateClick(day)}
        >
          <div className="h-full flex flex-col">
            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
              {day}
            </div>
            <div className="flex-1 space-y-1">
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.eventType)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventEdit(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Company Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(new Date());
                  setEditingEvent(null);
                  setEventForm({
                    title: '',
                    description: '',
                    startTime: '',
                    endTime: '',
                    location: '',
                    eventType: 'meeting',
                    isAllDay: false
                  });
                  setIsEventDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center h-10 flex items-center justify-center font-medium text-sm ${
                      index === 0 || index === 6 ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Add Event'}
              {selectedDate && !editingEvent && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {selectedDate.toLocaleDateString()}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventForm.eventType} onValueChange={(value) => setEventForm(prev => ({ ...prev, eventType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="company_meeting">Company Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              {editingEvent && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsEventDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEvent}
                disabled={!eventForm.title}
              >
                {editingEvent ? 'Update' : 'Create'} Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}