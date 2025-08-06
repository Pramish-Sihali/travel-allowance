'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface HallBookingFormProps {
  open: boolean;
  onSave: () => void;
  onCancel: () => void;
}

interface HallBookingFormData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  maxAttendees?: number;
}

export function HallBookingForm({ open, onSave, onCancel }: HallBookingFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<HallBookingFormData>({
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isAllDay: false,
      maxAttendees: undefined
    }
  });

  const isAllDay = watch('isAllDay');

  const onSubmit = async (data: HallBookingFormData) => {
    setLoading(true);
    try {
      const eventData = {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        startTime: data.isAllDay ? undefined : data.startTime,
        endTime: data.isAllDay ? undefined : data.endTime,
        isAllDay: data.isAllDay,
        eventType: 'hall_booking',
        location: 'Main Conference Hall', // Default hall since there's only one
        maxAttendees: data.maxAttendees
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to book hall');
      }
    } catch (error) {
      console.error('Error booking hall:', error);
      alert('Failed to book hall');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset form when opening
      reset();
    }
  }, [open, reset]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form state immediately when closing
      reset();
      // Ensure focus is returned to body
      if (typeof document !== 'undefined') {
        document.body.style.pointerEvents = '';
        document.body.focus();
      }
      // Small delay to ensure dialog closes properly
      setTimeout(() => {
        onCancel();
      }, 50);
    }
  };

  const handleCancel = () => {
    // Reset form state when canceling
    reset();
    // Ensure focus is returned to body
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.focus();
    }
    // Call parent cancel handler with slight delay
    setTimeout(() => {
      onCancel();
    }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Conference Hall</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Event title is required' })}
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
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="isAllDay"
                checked={isAllDay}
                onCheckedChange={(checked) => setValue('isAllDay', !!checked)}
              />
              <Label htmlFor="isAllDay">All day event</Label>
            </div>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                />
              </div>

              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="maxAttendees">Expected Attendees (Optional)</Label>
            <Input
              id="maxAttendees"
              type="number"
              {...register('maxAttendees', { valueAsNumber: true })}
              placeholder="Enter expected number of attendees"
              min="1"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Hall:</strong> Main Conference Hall
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This booking is for the main conference hall. Contact admin if you need additional facilities.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Booking...' : 'Book Hall'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}