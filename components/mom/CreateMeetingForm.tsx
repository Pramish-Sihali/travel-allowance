'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus,
  X, 
  MapPin, 
  Users, 
  Calendar,
  Clock,
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Meeting minutes table component
import MeetingMinutesTable from './MeetingMinutesTable';

interface MeetingMinute {
  id?: string;
  serialNo: number;
  responsibility: string;
  assignedToId: string;
  assignedToName: string;
  deadline: string;
  remarks: string;
  isDone: boolean;
  flags: string;
  toggledBy?: string;
  toggledAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

const meetingFormSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  taskId: z.string().optional(),
  meetingType: z.enum(['internal', 'external'], {
    required_error: 'Please select meeting type'
  }),
  clientId: z.string().optional(),
  newClientName: z.string().optional(),
  locationType: z.enum(['office', 'online', 'current_location'], {
    required_error: 'Please select location type'
  }),
  locationDetails: z.string().min(1, 'Location details are required'),
  meetingDate: z.string().min(1, 'Meeting date is required'),
  meetingTime: z.string().optional(),
  duration: z.string().optional(),
  assignedTo: z.string().optional(),
  deadlineDate: z.string().optional(),
  deadlineTime: z.string().optional(),
  priority: z.string().default('medium'),
  // Meeting minutes will be handled separately as an array
});

type MeetingFormData = z.infer<typeof meetingFormSchema>;

interface Task {
  id: string;
  title: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  client_type: string;
}

interface InternalAttendee {
  id: string;
  name: string;
  email: string;
}

interface ExternalAttendee {
  name: string;
  email: string;
  organization: string;
}

interface CreateMeetingFormProps {
  onMeetingCreated: () => void;
  userId?: string;
  userName?: string;
}

export default function CreateMeetingForm({ onMeetingCreated, userId, userName }: CreateMeetingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [internalAttendees, setInternalAttendees] = useState<InternalAttendee[]>([]);
  const [externalAttendees, setExternalAttendees] = useState<ExternalAttendee[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      meetingType: 'internal',
      locationType: 'office',
      priority: 'medium',
    },
  });

  const meetingType = form.watch('meetingType');
  const locationType = form.watch('locationType');

  // Fetch initial data
  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchClients();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?status=active');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/employees');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              address = data.results[0].formatted;
            }
          }

          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            address: address
          });

          form.setValue('locationDetails', address);
          
          toast.success(`Current location: ${address}`);
        } catch (error) {
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            address: fallbackAddress
          });
          form.setValue('locationDetails', fallbackAddress);
          
          toast.success(`Current location: ${fallbackAddress}`);
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error("Could not retrieve your current location. Please enter manually.");
        setLocationLoading(false);
      }
    );
  };

  const addInternalAttendee = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && !internalAttendees.find(a => a.id === userId)) {
      setInternalAttendees([...internalAttendees, user]);
    }
  };

  const removeInternalAttendee = (userId: string) => {
    setInternalAttendees(internalAttendees.filter(a => a.id !== userId));
  };

  const addExternalAttendee = (name: string, email: string, organization: string) => {
    if (name.trim()) {
      const newAttendee = { name: name.trim(), email: email.trim(), organization: organization.trim() };
      setExternalAttendees([...externalAttendees, newAttendee]);
    }
  };

  const removeExternalAttendee = (index: number) => {
    setExternalAttendees(externalAttendees.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MeetingFormData) => {
    try {
      setLoading(true);

      // Validate that at least one meeting minute is added
      if (meetingMinutes.length === 0) {
        toast.error("Please add at least one meeting minute or action item.");
        setLoading(false);
        return;
      }

      // Validate that all required fields in meeting minutes are filled
      const invalidMinutes = meetingMinutes.filter(minute => 
        !minute.responsibility.trim() || 
        (!minute.assignedToId && !minute.assignedToName)
      );

      if (invalidMinutes.length > 0) {
        toast.error("Please ensure all meeting minutes have responsibility and assigned person filled.");
        setLoading(false);
        return;
      }

      const meetingData = {
        ...data,
        createdBy: userId,
        createdByName: userName,
        internalAttendees,
        externalAttendees,
        currentLocation,
        meetingMinutes,
      };

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (response.ok) {
        toast.success("Meeting created successfully!");
        
        // Reset form and attendees
        form.reset();
        setInternalAttendees([]);
        setExternalAttendees([]);
        setCurrentLocation(null);
        setMeetingMinutes([]);
        
        onMeetingCreated();
      } else {
        throw new Error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error("Failed to create meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter meeting title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Task</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title} ({task.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="internal" id="internal" />
                            <Label htmlFor="internal">Internal</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="external" id="external" />
                            <Label htmlFor="external">External</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="meetingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Client Selection (for external meetings) */}
          {meetingType === 'external' && (
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Client</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose existing client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} - {client.company} ({client.client_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newClientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Or New Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter new client name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="office" id="office" />
                          <Label htmlFor="office">Office</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="online" id="online" />
                          <Label htmlFor="online">Online</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="current_location" id="current_location" />
                          <Label htmlFor="current_location">Current Location</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {locationType === 'current_location' && (
                <div className="space-y-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Current Location
                      </>
                    )}
                  </Button>
                  
                  {currentLocation && (
                    <div className="text-sm text-muted-foreground p-2 bg-green-50 rounded">
                      <strong>Detected Location:</strong> {currentLocation.address}
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="locationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Details *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={
                          locationType === 'office' ? 'e.g., Conference Room A, 2nd Floor' :
                          locationType === 'online' ? 'e.g., Zoom Meeting Link' :
                          'Location will be auto-filled when you get current location'
                        }
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Attendees Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Internal Attendees */}
              <div>
                <Label className="text-sm font-medium">Internal Attendees</Label>
                <Select onValueChange={addInternalAttendee}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Add internal attendees" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => !internalAttendees.find(a => a.id === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {internalAttendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {internalAttendees.map((attendee) => (
                      <Badge key={attendee.id} variant="secondary" className="flex items-center gap-2">
                        {attendee.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeInternalAttendee(attendee.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* External Attendees */}
              <div>
                <Label className="text-sm font-medium">External Attendees</Label>
                <ExternalAttendeeForm onAdd={addExternalAttendee} />
                
                {externalAttendees.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {externalAttendees.map((attendee, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="text-sm">
                          <strong>{attendee.name}</strong> ({attendee.email})
                          {attendee.organization && ` - ${attendee.organization}`}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExternalAttendee(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment and Deadline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Assignment & Deadline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Responsibility To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select person responsible" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deadlineDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadlineTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Meeting Minutes */}
          <Card>
            <CardContent className="pt-6">
              <MeetingMinutesTable
                meetingMinutes={meetingMinutes}
                onMinutesChange={setMeetingMinutes}
                isReadOnly={false}
                currentUserId={userId}
                currentUserName={userName}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setInternalAttendees([]);
                    setExternalAttendees([]);
                    setCurrentLocation(null);
                    setMeetingMinutes([]);
                  }}
                  disabled={loading}
                >
                  Reset Form
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Meeting
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

// External Attendee Form Component
function ExternalAttendeeForm({ onAdd }: { onAdd: (name: string, email: string, organization: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name, email, organization);
      setName('');
      setEmail('');
      setOrganization('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Email (optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        placeholder="Organization"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
      />
      <Button type="button" onClick={handleAdd} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  );
}