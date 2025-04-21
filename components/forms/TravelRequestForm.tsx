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
  Users
} from "lucide-react";

// Import shared expense section component
import SharedExpenseSection, { ExpenseItemFormData } from '@/components/forms/SharedExpenseSection';
import EmployeeInfoSection from '@/components/forms/EmployeeInfoSection';


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

// =============== SCHEMA & TYPES ===============
// Define Zod schema for travel details (Phase 1)
const travelDetailsSchema = z.object({
  // Employee Information
  employeeId: z.string(),
  employeeName: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  
  // Request Type
  requestType: z.enum(["normal", "advance", "emergency"]),
  
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
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
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
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);



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
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [phase, setPhase] = useState<1 | 2>(1);  // Phase 1: Travel Details, Phase 2: Expenses
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [approverComments, setApproverComments] = useState<string>('');
  
  // Expense items for Phase 2
  const [expenseItems, setExpenseItems] = useState<ExpenseItemFormData[]>([
    { category: 'accommodation', amount: 0, description: '' },
  ]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  
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
            
            if (data.approverComments) {
              setApproverComments(data.approverComments);
            }
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
        // Use the new API endpoint
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
    
    // Add this line to call the function:
    fetchApprovers();
    
  }, []); // Add empty dependency array here
  
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
  
  // Function to add a new expense item
  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { category: 'accommodation', amount: 0 }]);
  };
  
  // Function to remove an expense item
  const removeExpenseItem = (index: number) => {
    const updatedItems = [...expenseItems];
    updatedItems.splice(index, 1);
    setExpenseItems(updatedItems);
  };
  
  // Handle expense item change
  const handleExpenseChange = (index: number, field: keyof ExpenseItemFormData, value: any) => {
    const updatedExpenses = [...expenseItems];
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value };
    setExpenseItems(updatedExpenses);
  };
  
  // Handle file selection for receipts
  const handleFileChange = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File selected:', category, e.target.files?.[0]?.name);
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => ({
        ...prev,
        [category]: e.target.files![0]
      }));
    }
  };
  
  // Calculate total expense amount
  const calculateTotalAmount = () => {
    return expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };
  
  // Handle Phase 1 form submission (Travel Details)
  const onSubmitTravelDetails = async (data: TravelDetailsFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the request data
      const requestData = {
        ...data,
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
  
  // Handle Phase 2 form submission (Expenses)
  const onSubmitExpenses = async (data: ExpensesFormValues) => {
    if (!requestId) {
      alert('No request ID found. Please try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the request with expense info
      const updateData = {
        phase: 2,
        totalAmount: calculateTotalAmount(),
        previousOutstandingAdvance: data.previousOutstandingAdvance,
        status: 'pending_verification', // Move directly to financial verification
        expenses_submitted_at: new Date().toISOString()
      };
      
      console.log('Updating request with expenses:', updateData);
      
      // Update the travel request
      const response = await fetch(`/api/requests/${requestId}/expenses`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.error || response.statusText}`);
      }
      
      const updatedRequest = await response.json();
      
      // Create expense items
      for (const expenseItem of expenseItems) {
        if (expenseItem.amount > 0) {
          console.log('Creating expense item:', expenseItem);
          
          const expenseResponse = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...expenseItem,
              requestId: requestId,
            }),
          });
          
          if (!expenseResponse.ok) {
            throw new Error('Failed to create expense item');
          }
          
          const createdExpense = await expenseResponse.json();
          console.log('Expense item created:', createdExpense);
          
          // Upload receipt if available
          const fileKey = `${expenseItem.category}-${expenseItems.indexOf(expenseItem)}`;
          const file = selectedFiles[fileKey];
          
          if (file) {
            console.log('Uploading receipt for expense:', { 
              expenseId: createdExpense.id, 
              fileName: file.name 
            });
            
            const formDataFile = new FormData();
            formDataFile.append('file', file);
            formDataFile.append('expenseItemId', createdExpense.id);
            
            try {
              const uploadResponse = await fetch('/api/receipts/upload', {
                method: 'POST',
                body: formDataFile,
              });
              
              const uploadResult = await uploadResponse.json();
              
              if (!uploadResponse.ok) {
                console.error('Receipt upload failed:', uploadResult);
                // Continue with the next expense item instead of throwing
              } else {
                console.log('Receipt uploaded successfully:', uploadResult);
              }
            } catch (uploadError) {
              console.error('Error during receipt upload:', uploadError);
              // Continue with the next expense item instead of throwing
            }
          }
        }
      }
      
      // Navigate to dashboard on success
      router.push('/employee/dashboard?success=expenses_submitted');
      
    } catch (error) {
      console.error('Error submitting expenses:', error);
      alert('There was an error submitting your expenses. Please try again.');
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
        // Phase 2: Expenses Form
        <Form {...expensesForm}>
          <form onSubmit={expensesForm.handleSubmit(onSubmitExpenses)}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Display request details in read-only mode */}
                {requestDetails && (
                  <>
                    {/* Show the approved travel details in read-only */}
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <div className="flex items-center text-green-700 mb-2">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Approved Travel Details</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your travel request has been approved by the manager. Please add your expenses below.
                      </p>
                    </div>
                    
                    {/* Show approver comments if available */}
                    {approverComments && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <h4 className="font-medium text-blue-700 mb-1">Approver Comments</h4>
                        <p className="text-sm">{approverComments}</p>
                      </div>
                    )}
                    
                    {/* Read-only request type */}
                    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center mb-4">
                        <Clock className="h-5 w-5 text-primary mr-2" />
                        <h3 className="text-lg font-medium">Request Type</h3>
                      </div>
                      <div className="flex items-center px-4 py-2 border rounded-md bg-muted/10">
                        {requestDetails.requestType === 'normal' && <FileText className="h-5 w-5 text-blue-500 mr-2" />}
                        {requestDetails.requestType === 'advance' && <CreditCard className="h-5 w-5 text-green-500 mr-2" />}
                        {requestDetails.requestType === 'emergency' && <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />}
                        <span className="font-medium capitalize">{requestDetails.requestType} Request</span>
                      </div>
                    </div>
                    
                    {/* Employee information */}
                    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center mb-4">
                        <UserIcon className="h-5 w-5 text-primary mr-2" />
                        <h3 className="text-lg font-medium">Employee Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium flex items-center mb-1">
                            <BadgeInfo className="h-4 w-4 mr-2 text-muted-foreground" />
                            Full Name
                          </label>
                          <div className="py-2 px-3 border rounded-md bg-muted/10">
                            {requestDetails.employeeName}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium flex items-center mb-1">
                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                            Department
                          </label>
                          <div className="py-2 px-3 border rounded-md bg-muted/10">
                            {requestDetails.department}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium flex items-center mb-1">
                            <BriefcaseBusiness className="h-4 w-4 mr-2 text-muted-foreground" />
                            Designation
                          </label>
                          <div className="py-2 px-3 border rounded-md bg-muted/10">
                            {requestDetails.designation}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Travel details section with read-only values */}
                    <TravelDetailsSection
                      form={{
                        control: {
                          // Mock control for read-only
                          register: () => ({}),
                          watch: () => "",
                        },
                        setValue: () => {},
                        formState: { errors: {} },
                      }}
                      projectOptions={projectOptions}
                      loadingProjects={false}
                      readOnly={true}
                    />
                  </>
                )}
                
                {/* Expenses Section (phase 2) */}
                <SharedExpenseSection
                  form={expensesForm}
                  expenseItems={expenseItems}
                  addExpenseItem={addExpenseItem}
                  removeExpenseItem={removeExpenseItem}
                  handleExpenseChange={handleExpenseChange}
                  handleFileChange={handleFileChange}
                  selectedFiles={selectedFiles}
                  calculateTotalAmount={calculateTotalAmount}
                  categoryOptions={expenseCategoryOptions}
                  showPreviousAdvance={true}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between p-6 bg-muted/10 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/employee/dashboard')}
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
                    Submit Expenses
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
}