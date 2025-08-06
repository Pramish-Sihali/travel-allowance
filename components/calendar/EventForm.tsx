'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Event, EventType } from '@/types';
import { Trash2 } from 'lucide-react';

interface EventFormProps {
  event?: Event | null;
  open: boolean;
  onSave: () => void;
  onCancel: () => void;
}

interface EventFormData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  eventType: EventType;
  location?: string;
  maxAttendees?: number;
}

// Event types available to all employees
const EMPLOYEE_EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'potluck', label: 'Potluck/Social Event' },
  { value: 'birthday', label: 'Birthday Celebration' },
  { value: 'team_outing', label: 'Team Outing' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'general', label: 'General Event' }
];

// Event types available only to approvers/admins
const APPROVER_EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'company_meeting', label: 'Company Meeting' },
  { value: 'training', label: 'Training Session' },
  { value: 'holiday', label: 'Company Holiday' },
  { value: 'deadline', label: 'Important Deadline' },
  { value: 'announcement', label: 'Company Announcement' }
];

export function EventForm({ event, open, onSave, onCancel }: EventFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEditing = !!event;
  const isApprover = ['approver', 'admin'].includes(session?.user?.role || '');

  // Get available event types based on user role
  const availableEventTypes = isApprover 
    ? [...EMPLOYEE_EVENT_TYPES, ...APPROVER_EVENT_TYPES]
    : EMPLOYEE_EVENT_TYPES;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EventFormData>({
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      startDate: event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      endDate: event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      eventType: event?.eventType || 'general',
      location: event?.location || '',
      maxAttendees: event?.maxAttendees || undefined
    }
  });

  const eventType = watch('eventType');

  useEffect(() => {
    if (event) {
      setValue('title', event.title);
      setValue('description', event.description || '');
      setValue('startDate', new Date(event.startDate).toISOString().split('T')[0]);
      setValue('endDate', new Date(event.endDate).toISOString().split('T')[0]);
      setValue('eventType', event.eventType);
      setValue('location', event.location || '');
      setValue('maxAttendees', event.maxAttendees || undefined);
    }
  }, [event, setValue]);

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      const eventData = {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        eventType: data.eventType,
        location: data.location,
        maxAttendees: data.maxAttendees
      };

      const url = isEditing ? `/api/events/${event.id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const canDelete = isEditing && (
    isApprover || 
    event?.createdBy === session?.user?.id
  );

  const handleDelete = async () => {
    if (!event || !canDelete || !confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Small delay to ensure dialog closes properly
      setTimeout(() => {
        onCancel();
      }, 100);
    }
  };

  const handleCancel = () => {
    // Reset form state when canceling
    reset();
    
    // Call parent cancel handler
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter event description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate', { required: 'End date is required' })}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Enter event location"
            />
          </div>

          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={(value: EventType) => setValue('eventType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {availableEventTypes.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isApprover && (
              <p className="text-xs text-muted-foreground mt-1">
                Contact an approver to create company meetings, holidays, or announcements
              </p>
            )}
          </div>

          {(eventType === 'workshop' || eventType === 'team_outing') && (
            <div>
              <Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
              <Input
                id="maxAttendees"
                type="number"
                {...register('maxAttendees', { valueAsNumber: true })}
                placeholder="Enter maximum number of attendees"
                min="1"
              />
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}