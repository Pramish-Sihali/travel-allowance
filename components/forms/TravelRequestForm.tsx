'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ExpenseCategory, RequestType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Loader2, 
  UserIcon, 
  CreditCard, 
  MapPin, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  BriefcaseBusiness,
  BadgeInfo,
  DollarSign,
  Users,
  UserPlus,
  X,
  UserCheck,
  UsersRound
} from "lucide-react";

// Import shared components
import EmployeeInfoSection from '@/components/forms/EmployeeInfoSection';
import ExpenseSubmissionForm from '@/components/forms/ExpenseSubmissionForm';

// Import constants
import { 
  purposeOptions, 
  locationOptions, 
  transportModeOptions,
  yesNoOptions,
  expenseCategoryOptions
} from "./constants";

// Define project type
interface ProjectOption {
  value: string;
  label: string;
}

// Define approver type
interface ApproverOption {
  value: string;
  label: string;
  email?: string;
}

// Define user type for group travel members
interface UserOption {
  id: string;
  name: string;
  department?: string;
  designation?: string;
  email?: string;
}

// =============== SCHEMA & TYPES ===============
// Define Zod schema for travel details (Phase 1)
const travelDetailsSchema = z.object({
  // Employee Information
  employeeId: z.string(),
  employeeName: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  
  // Request Type
  requestType: z.enum(["normal", "advance", "emergency", "group"]),
  
  // Travel Details
  project: z.string().min(1, "Project is required"),
  projectOther: z.string().optional(),
  purposeType: z.string().min(1, "Purpose is required"),
  purposeOther: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  locationOther: z.string().optional(),
  
  // Dates validation
  travelDateFrom: z.string().min(1, "Start date is required"),
  travelDateTo: z.string().min(1, "End date is required"),
  
  // Transportation
  transportMode: z.string().min(1, "Mode of transport is required"),
  stationPickDrop: z.string().min(1, "This field is required"),
  localConveyance: z.string().min(1, "This field is required"),
  rideShareUsed: z.boolean().default(false),
  ownVehicleReimbursement: z.boolean().default(false),
  
  // Group travel (optional)
  isGroupCaptain: z.boolean().optional().default(false),
  groupSize: z.string().optional(),
  groupMembers: z.array(z.string()).optional().default([]),
  groupDescription: z.string().optional(),
  
  // Approver selection
  approverId: z.string().min(1, "Please select an approver"),
})
.refine(
  (data) => {
    if (data.project === "other" && !data.projectOther) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify the other project",
    path: ["projectOther"],
  }
)
.refine(
  (data) => {
    if (data.purposeType === "other" && !data.purposeOther) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify the other purpose",
    path: ["purposeOther"],
  }
)
.refine(
  (data) => {
    if (data.location === "other" && !data.locationOther) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify the other location",
    path: ["locationOther"],
  }
)
.refine(
  (data) => {
    const fromDate = new Date(data.travelDateFrom);
    const toDate = new Date(data.travelDateTo);
    return fromDate <= toDate;
  },
  {
    message: "End date cannot be before start date",
    path: ["travelDateTo"],
  }
)
.refine(
  (data) => {
    if (data.requestType === "group" && data.isGroupCaptain && (!data.groupSize || !data.groupDescription)) {
      return false;
    }
    return true;
  },
  {
    message: "Group size and description are required for group travel",
    path: ["groupDescription"],
  }
);

// Define Zod schema for expenses (Phase 2)
const expensesSchema = z.object({
  previousOutstandingAdvance: z.coerce.number().default(0),
});

// Infer the types from the schemas
type TravelDetailsFormValues = z.infer<typeof travelDetailsSchema>;
type ExpensesFormValues = z.infer<typeof expensesSchema>;

// =============== COMPONENTS ===============

// 1. RequestTypeSection Component
const RequestTypeSection = ({ form }: { form: any }) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <Clock className="h-5 w-5 text-primary mr-2" />
      <h3 className="text-lg font-medium">Request Type</h3>
    </div>
    
    <FormField
      control={form.control}
      name="requestType"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2"
            >
              <div>
                <RadioGroupItem
                  value="normal"
                  id="requestType-normal"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-normal"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <FileText className="h-6 w-6 mb-3 text-blue-500" />
                  <span className="font-medium">Normal Request</span>
                  <span className="text-xs text-muted-foreground mt-1">Standard processing</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="advance"
                  id="requestType-advance"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-advance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="h-6 w-6 mb-3 text-green-500" />
                  <span className="font-medium">Advance Request</span>
                  <span className="text-xs text-muted-foreground mt-1">Get funds before travel</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="emergency"
                  id="requestType-emergency"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-emergency"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <AlertTriangle className="h-6 w-6 mb-3 text-red-500" />
                  <span className="font-medium">Emergency Request</span>
                  <span className="text-xs text-muted-foreground mt-1">Urgent processing</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="group"
                  id="requestType-group"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="requestType-group"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <UsersRound className="h-6 w-6 mb-3 text-purple-500" />
                  <span className="font-medium">Group Travel</span>
                  <span className="text-xs text-muted-foreground mt-1">For team travel</span>
                </Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    {/* Group Travel Captain Checkbox - only show when group travel is selected */}
    {form.watch('requestType') === 'group' && (
      <div className="mt-4 p-4 border rounded-md bg-purple-50">
        <FormField
          control={form.control}
          name="isGroupCaptain"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I am the Group Captain</FormLabel>
                <FormDescription>
                  Check this box if you are organizing this group travel
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    )}
  </div>
);

// 2. GroupTravelSection Component - only shown for group travel
const GroupTravelSection = ({ 
  form, 
  userOptions, 
  loadingUsers,
  selectedMembers,
  setSelectedMembers
}: { 
  form: any, 
  userOptions: UserOption[],
  loadingUsers: boolean,
  selectedMembers: UserOption[],
  setSelectedMembers: React.Dispatch<React.SetStateAction<UserOption[]>>
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Filter users based on search term
  const filteredUsers = userOptions.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Add member to selected members
  const addMember = (user: UserOption) => {
    if (!selectedMembers.some(member => member.id === user.id)) {
      const newMembers = [...selectedMembers, user];
      setSelectedMembers(newMembers);
      
      // Update the form value with IDs
      form.setValue('groupMembers', newMembers.map(member => member.id));
    }
    setSearchTerm('');
    setShowDropdown(false);
  };
  
  // Remove member from selected members
  const removeMember = (userId: string) => {
    const newMembers = selectedMembers.filter(member => member.id !== userId);
    setSelectedMembers(newMembers);
    
    // Update the form value with IDs
    form.setValue('groupMembers', newMembers.map(member => member.id));
  };
  
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <UsersRound className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium">Group Travel Details</h3>
      </div>
      
      <div className="p-4 border rounded-md bg-muted/10">
        <div className="mb-3">
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Only to be filled by Group Captain
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Group Size */}
          <FormField
            control={form.control}
            name="groupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Number of People</span>
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2"
                    {...field}
                    placeholder="Enter total number of people"
                    disabled={!form.watch('isGroupCaptain')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Group Members Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Group Members</span>
            </Label>
            
            <div className="relative">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setShowDropdown(true);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={!form.watch('isGroupCaptain') || loadingUsers}
              />
              
              {/* User dropdown for selection */}
              {showDropdown && searchTerm && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border max-h-60 overflow-auto">
                  {loadingUsers ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => addMember(user)}
                      >
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.email && (
                            <div className="text-xs text-gray-500">{user.email}</div>
                          )}
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            addMember(user);
                          }}
                        >
                          <UserPlus size={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Selected members */}
            <div className="mt-2 space-y-2">
              {selectedMembers.length > 0 ? (
                <div className="border rounded-md p-2">
                  <p className="text-sm text-gray-500 mb-2">Selected members:</p>
                  <div className="space-y-1">
                    {selectedMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          {member.department && (
                            <div className="text-xs text-gray-500">{member.department}</div>
                          )}
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeMember(member.id)}
                          disabled={!form.watch('isGroupCaptain')}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No members selected yet</p>
              )}
            </div>
          </div>
          
          {/* Group Description */}
          <FormField
            control={form.control}
            name="groupDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Travel Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe the purpose and details of this group travel" 
                    className="resize-none min-h-[100px]"
                    disabled={!form.watch('isGroupCaptain')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

// 3. TravelDetailsSection Component
const TravelDetailsSection = ({ 
  form, 
  projectOptions, 
  loadingProjects,
  readOnly = false
}: { 
  form: any, 
  projectOptions: ProjectOption[], 
  loadingProjects: boolean,
  readOnly?: boolean
}) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <MapPin className="h-5 w-5 text-primary mr-2" />
      <h3 className="text-lg font-medium">Travel Details</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/10">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Project & Purpose Information</h4>
          
          <div className="space-y-4">
            {/* Project selection */}
            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  {readOnly ? (
                    <Input {...field} readOnly className="bg-muted/30" value={
                      projectOptions.find(p => p.value === field.value)?.label || field.value
                    } />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingProjects || readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select project"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!readOnly && form.watch('project') === 'other' && (
              <FormField
                control={form.control}
                name="projectOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Project</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter project name" readOnly={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Purpose of travel */}
            <FormField
              control={form.control}
              name="purposeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Travel</FormLabel>
                  {readOnly ? (
                    <Input {...field} readOnly className="bg-muted/30" value={
                      purposeOptions.find(p => p.value === field.value)?.label || field.value
                    } />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purposeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!readOnly && form.watch('purposeType') === 'other' && (
              <FormField
                control={form.control}
                name="purposeOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Purpose</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter purpose" readOnly={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  {readOnly ? (
                    <Input {...field} readOnly className="bg-muted/30" value={
                      locationOptions.find(l => l.value === field.value)?.label || field.value
                    } />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!readOnly && form.watch('location') === 'other' && (
              <FormField
                control={form.control}
                name="locationOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter location" readOnly={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/10">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Travel Schedule & Transport</h4>
          
          <div className="space-y-4">
            {/* Travel Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="travelDateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>From Date</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        readOnly={readOnly}
                        className={readOnly ? "bg-muted/30" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="travelDateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>To Date</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        readOnly={readOnly}
                        className={readOnly ? "bg-muted/30" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Mode of Transport */}
            <FormField
              control={form.control}
              name="transportMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode of Transport</FormLabel>
                  {readOnly ? (
                    <Input {...field} readOnly className="bg-muted/30" value={
                      transportModeOptions.find(t => t.value === field.value)?.label || field.value
                    } />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transportModeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {option.icon}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Transport Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Station/Pick/Drop */}
              <FormField
                control={form.control}
                name="stationPickDrop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station/Pick/Drop</FormLabel>
                    {readOnly ? (
                      <Input {...field} readOnly className="bg-muted/30" value={
                        yesNoOptions.find(o => o.value === field.value)?.label || field.value
                      } />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yesNoOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Local Conveyance */}
              <FormField
                control={form.control}
                name="localConveyance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Conveyance</FormLabel>
                    {readOnly ? (
                      <Input {...field} readOnly className="bg-muted/30" value={
                        yesNoOptions.find(o => o.value === field.value)?.label || field.value
                      } />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yesNoOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Checkboxes */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <FormField
                control={form.control}
                name="rideShareUsed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ride Share Used</FormLabel>
                      <FormDescription>
                        Check if using ride sharing services
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownVehicleReimbursement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Own Vehicle</FormLabel>
                      <FormDescription>
                        Request reimbursement for personal vehicle
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 4. ApproverSelectionSection Component
const ApproverSelectionSection = ({ 
  form, 
  approverOptions, 
  loadingApprovers,
  readOnly = false 
}: { 
  form: any, 
  approverOptions: ApproverOption[], 
  loadingApprovers: boolean,
  readOnly?: boolean
}) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <Users className="h-5 w-5 text-primary mr-2" />
      <h3 className="text-lg font-medium">Approver Selection</h3>
    </div>
    
    <FormField
      control={form.control}
      name="approverId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Select Approver</FormLabel>
          {readOnly ? (
            <Input {...field} readOnly className="bg-muted/30" value={
              approverOptions.find(a => a.value === field.value)?.label || field.value
            } />
          ) : (
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={loadingApprovers || readOnly}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={loadingApprovers ? "Loading approvers..." : "Select an approver"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {approverOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.email && <span className="text-xs text-muted-foreground">{option.email}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormDescription>
            This person will review and approve your travel request
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

// =============== MAIN COMPONENT ===============
export default function TravelRequestForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [approverOptions, setApproverOptions] = useState<ApproverOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [phase, setPhase] = useState<1 | 2>(1);  // Phase 1: Travel Details, Phase 2: Expenses
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  
  // Initialize form with react-hook-form and zod resolver for Phase 1
  const travelDetailsForm = useForm<TravelDetailsFormValues>({
    resolver: zodResolver(travelDetailsSchema) as any,
    defaultValues: {
      employeeId: '',
      employeeName: '',
      department: '',
      designation: '',
      requestType: 'normal',
      project: '',
      projectOther: '',
      purposeType: '',
      purposeOther: '',
      location: '',
      locationOther: '',
      travelDateFrom: '',
      travelDateTo: '',
      transportMode: '',
      stationPickDrop: 'na',
      localConveyance: 'na',
      rideShareUsed: false,
      ownVehicleReimbursement: false,
      isGroupCaptain: false,
      groupSize: '',
      groupMembers: [],
      groupDescription: '',
      approverId: '',
    },
  });
  
  // Initialize form for Phase 2 (expenses)
  const expensesForm = useForm<ExpensesFormValues>({
    resolver: zodResolver(expensesSchema) as any,
    defaultValues: {
      previousOutstandingAdvance: 0,
    },
  });
  
  // Check if we're in expense submission mode (Phase 2)
  useEffect(() => {
    const id = searchParams.get('id');
    const expenseMode = searchParams.get('expenses');
    
    if (id && expenseMode === 'true') {
      setPhase(2);
      setRequestId(id);
      
      // Fetch request details to display in the expense form
      const fetchRequestDetails = async () => {
        try {
          const response = await fetch(`/api/requests/${id}`);
          if (response.ok) {
            const data = await response.json();
            setRequestDetails(data);
          } else {
            console.error('Failed to fetch request details');
            router.push('/employee/dashboard');
          }
        } catch (error) {
          console.error('Error fetching request details:', error);
          router.push('/employee/dashboard');
        }
      };
      
      fetchRequestDetails();
    }
  }, [searchParams, router]);
  
  // Fetch projects from the database
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        
        // Transform projects into options format
        const options: ProjectOption[] = data
          .filter((project: any) => project.active) // Only include active projects
          .map((project: any) => ({
            value: project.id,
            label: project.name
          }));
        
        // Add "Other" option
        options.push({ value: 'other', label: 'Other' });
        
        setProjectOptions(options);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Fallback to a default option if fetch fails
        setProjectOptions([
          { value: 'other', label: 'Other' }
        ]);
      } finally {
        setLoadingProjects(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Fetch approvers from the database
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoadingApprovers(true);
        const response = await fetch('/api/approvers');
        if (!response.ok) {
          throw new Error('Failed to fetch approvers');
        }
        
        const data = await response.json();
        setApproverOptions(data);
      } catch (error) {
        console.error('Error fetching approvers:', error);
        // Fallback to empty list if fetch fails
        setApproverOptions([]);
      } finally {
        setLoadingApprovers(false);
      }
    };
    
    fetchApprovers();
  }, []);
  
  // Fetch all users for group travel member selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        
        // Transform users into options format
        const options: UserOption[] = data
          .filter((user: any) => user.role === 'employee') // Only include employees
          .map((user: any) => ({
            id: user.id,
            name: user.name || 'Unnamed User',
            email: user.email,
            department: user.department,
            designation: user.designation
          }));
        
        setUserOptions(options);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Fallback to empty list if fetch fails
        setUserOptions([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    // Only fetch users if we need them for group travel
    if (travelDetailsForm.watch('requestType') === 'group' && travelDetailsForm.watch('isGroupCaptain')) {
      fetchUsers();
    }
  }, [travelDetailsForm.watch('requestType'), travelDetailsForm.watch('isGroupCaptain')]);
  
  // Update employeeId and prefill form with session data when available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setEmployeeId(session.user.id);
      travelDetailsForm.setValue('employeeId', session.user.id);
      
      if (session.user.name) {
        travelDetailsForm.setValue('employeeName', session.user.name);
      }
      
      // Fetch user profile data from the correct API endpoint
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`/api/user/${session.user.id}/profile`);
          if (response.ok) {
            const userData = await response.json();
            
            // Debug - log the data we're receiving
            console.log('User profile data received:', userData);
            
            // Update form with fetched data
            if (userData.department) {
              travelDetailsForm.setValue('department', userData.department);
            }
            if (userData.designation) {
              travelDetailsForm.setValue('designation', userData.designation);
            }
          } else {
            console.error('Failed to fetch user profile data:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [session, status, travelDetailsForm]);
  
  // Handle Phase 1 form submission (Travel Details)
  const onSubmitTravelDetails = async (data: TravelDetailsFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Handle Group Travel data
      const groupTravelData = data.requestType === 'group' && data.isGroupCaptain 
        ? {
            isGroupTravel: true,
            isGroupCaptain: true,
            groupSize: data.groupSize,
            groupMembers: data.groupMembers,
            groupDescription: data.groupDescription
          }
        : data.requestType === 'group' && !data.isGroupCaptain
        ? {
            isGroupTravel: true,
            isGroupCaptain: false
          }
        : {};
      
      // Prepare the request data
      const requestData = {
        ...data,
        ...groupTravelData,
        phase: 1,
        purpose: data.purposeType === 'other' ? data.purposeOther : data.purposeType,
        totalAmount: 0, // No expenses yet in Phase 1
        status: 'pending' as const,
      };
      
      console.log('Submitting travel details:', requestData);
      
      // Create the travel request
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.error || response.statusText}`);
      }
      
      const createdRequest = await response.json();
      console.log('Travel request created:', createdRequest);
      
      // Navigate to dashboard on success
      router.push('/employee/dashboard?success=travel_details_submitted');
      
    } catch (error) {
      console.error('Error submitting travel details:', error);
      alert('There was an error submitting your travel details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render either Phase 1 or Phase 2 form based on the current phase
  return (
    <Card className="max-w-5xl mx-auto bg-background shadow-md">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          {phase === 1 
            ? "Travel Request Form" 
            : "Travel Expense Submission"}
        </CardTitle>
        <CardDescription>
          {phase === 1 
            ? "Submit your travel request for approval" 
            : "Add your expenses and upload receipts for your approved travel"}
        </CardDescription>
      </CardHeader>
      
      {phase === 1 ? (
        // Phase 1: Travel Details Form
        <Form {...travelDetailsForm}>
          <form onSubmit={travelDetailsForm.handleSubmit(onSubmitTravelDetails)}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Request Type Section */}
                <RequestTypeSection form={travelDetailsForm} />
                
                {/* Group Travel Section - only show when group travel is selected and user is group captain */}
                {travelDetailsForm.watch('requestType') === 'group' && travelDetailsForm.watch('isGroupCaptain') && (
                  <GroupTravelSection 
                    form={travelDetailsForm}
                    userOptions={userOptions}
                    loadingUsers={loadingUsers}
                    selectedMembers={selectedMembers}
                    setSelectedMembers={setSelectedMembers}
                  />
                )}
                
                {/* Employee Information Section */}
                <EmployeeInfoSection form={travelDetailsForm} />
                
                {/* Travel Details Section */}
                <TravelDetailsSection 
                  form={travelDetailsForm} 
                  projectOptions={projectOptions}
                  loadingProjects={loadingProjects}
                />
                
                {/* Approver Selection Section */}
                <ApproverSelectionSection 
                  form={travelDetailsForm}
                  approverOptions={approverOptions}
                  loadingApprovers={loadingApprovers}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between p-6 bg-muted/10 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="gap-2 px-4"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gap-2 px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Travel Request
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      ) : (
        // Phase 2: Expenses Form - Use the shared ExpenseSubmissionForm component
        <ExpenseSubmissionForm 
          requestId={requestId!} 
          requestType="travel"
          categoryOptions={expenseCategoryOptions}
          showPreviousAdvance={true}
        />
      )}
    </Card>
  );
}