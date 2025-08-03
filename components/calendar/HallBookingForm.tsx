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
import { Badge } from '@/components/ui/badge';
import { Hall } from '@/types';
import { Users, MapPin, Wifi } from 'lucide-react';

interface HallBookingFormProps {
  onSave: () => void;
  onCancel: () => void;
}

interface HallBookingFormData {
  hallId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees?: number;
}

const AMENITY_ICONS: Record<string, any> = {
  projector: '📽️',
  whiteboard: '📝',
  audio_system: '🔊',
  tv_screen: '📺',
  stage: '🎭',
  wifi: <Wifi className="h-3 w-3" />,
};

export function HallBookingForm({ onSave, onCancel }: HallBookingFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<HallBookingFormData>();

  const hallId = watch('hallId');
  const date = watch('date');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // Fetch available halls
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const response = await fetch('/api/halls');
        if (response.ok) {
          const data = await response.json();
          setHalls(data);
        }
      } catch (error) {
        console.error('Error fetching halls:', error);
      }
    };

    fetchHalls();
  }, []);

  // Update selected hall when hallId changes
  useEffect(() => {
    if (hallId && halls.length > 0) {
      const hall = halls.find(h => h.id === hallId);
      setSelectedHall(hall || null);
      if (hall) {
        setValue('attendees', hall.capacity);
      }
    }
  }, [hallId, halls, setValue]);

  const onSubmit = async (data: HallBookingFormData) => {
    setLoading(true);
    try {
      const hall = halls.find(h => h.id === data.hallId);
      if (!hall) {
        alert('Please select a valid hall');
        return;
      }

      // Create start and end datetime strings
      const startDateTime = new Date(`${data.date}T${data.startTime}`).toISOString();
      const endDateTime = new Date(`${data.date}T${data.endTime}`).toISOString();

      // Auto-generate title: "Hall Booking: [Hall Name]"
      const eventData = {
        title: `Hall Booking: ${hall.name}`,
        description: data.purpose,
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: false,
        eventType: 'hall_booking',
        location: hall.location,
        hallId: data.hallId,
        maxAttendees: data.attendees
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

  const isTimeSlotValid = () => {
    if (!startTime || !endTime) return true;
    return startTime < endTime;
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Hall Booking</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="hallId">Select Hall/Room *</Label>
            <Select value={hallId} onValueChange={(value) => setValue('hallId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a hall or room" />
              </SelectTrigger>
              <SelectContent>
                {halls.map(hall => (
                  <SelectItem key={hall.id} value={hall.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{hall.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        <Users className="h-3 w-3 inline mr-1" />
                        {hall.capacity}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hallId && (
              <p className="text-sm text-red-600 mt-1">Please select a hall</p>
            )}
          </div>

          {selectedHall && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedHall.location}</span>
                <Users className="h-4 w-4 text-muted-foreground ml-auto" />
                <span className="text-sm">Capacity: {selectedHall.capacity}</span>
              </div>
              {selectedHall.amenities && selectedHall.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedHall.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {AMENITY_ICONS[amenity] || '•'} {amenity.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.date && (
              <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                min="09:00"
                max="17:30"
                {...register('startTime', { 
                  required: 'Start time is required',
                  validate: (value) => {
                    if (!value) return true;
                    const [hours, minutes] = value.split(':').map(Number);
                    const timeInMinutes = hours * 60 + minutes;
                    const minTime = 9 * 60; // 9:00 AM
                    const maxTime = 17 * 60 + 30; // 5:30 PM
                    if (timeInMinutes < minTime || timeInMinutes > maxTime) {
                      return 'Start time must be between 9:00 AM and 5:30 PM';
                    }
                    return true;
                  }
                })}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Office hours: 9:00 AM - 5:30 PM</p>
            </div>

            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                min="09:00"
                max="17:30"
                {...register('endTime', { 
                  required: 'End time is required',
                  validate: (value) => {
                    if (!value) return true;
                    const [hours, minutes] = value.split(':').map(Number);
                    const timeInMinutes = hours * 60 + minutes;
                    const minTime = 9 * 60; // 9:00 AM
                    const maxTime = 17 * 60 + 30; // 5:30 PM
                    if (timeInMinutes < minTime || timeInMinutes > maxTime) {
                      return 'End time must be between 9:00 AM and 5:30 PM';
                    }
                    return true;
                  }
                })}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {!isTimeSlotValid() && (
            <p className="text-sm text-red-600">End time must be after start time</p>
          )}

          <div>
            <Label htmlFor="purpose">Purpose/Description *</Label>
            <Textarea
              id="purpose"
              {...register('purpose', { required: 'Purpose is required' })}
              placeholder="Brief description of the meeting/event purpose"
              rows={3}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600 mt-1">{errors.purpose.message}</p>
            )}
          </div>

          {selectedHall && (
            <div>
              <Label htmlFor="attendees">Expected Attendees</Label>
              <Input
                id="attendees"
                type="number"
                {...register('attendees', { valueAsNumber: true })}
                placeholder="Number of attendees"
                max={selectedHall.capacity}
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum capacity: {selectedHall.capacity} people
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isTimeSlotValid()}
            >
              {loading ? 'Booking...' : 'Book Hall'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}