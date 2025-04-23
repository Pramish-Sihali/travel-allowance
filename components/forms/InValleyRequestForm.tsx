'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Loader2, 
  UserIcon, 
  CheckCircle2,
  Calendar,
  Building,
  BriefcaseBusiness,
  BadgeInfo,
  MapPin,
  CreditCard,
  Users
} from "lucide-react";

// Import shared components
import EmployeeInfoSection from '@/components/forms/EmployeeInfoSection';
import ExpenseSubmissionForm from '@/components/forms/ExpenseSubmissionForm';

// Import constants
import { 
  valleyPurposeOptions, 
  valleyExpenseCategoryOptions,
  meetingTypeOptions,
  paymentMethodOptions
} from "./valley-constants";

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
// Define Zod schema for expense details (Phase 1)
const valleyDetailsSchema = z.object({
  // Employee Information
  employeeId: z.string(),
  employeeName: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  
  // Request Details
  project: z.string().min(1, "Project is required"),
  projectOther: z.string().optional(),
  purposeType: z.string().min(1, "Purpose is required"),
  purposeOther: z.string().optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
  meetingType: z.string().optional(),
  meetingParticipants: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentMethodOther: z.string().optional(),
  
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
    if (data.paymentMethod === "other" && !data.paymentMethodOther) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify the other payment method",
    path: ["paymentMethodOther"],
  }
)
.refine(
  (data) => {
    if (data.purposeType === "meeting" && !data.meetingType) {
      return false;
    }
    return true;
  },
  {
    message: "Meeting type is required for meeting expenses",
    path: ["meetingType"],
  }
);

// Infer the type from the schema
type ValleyDetailsFormValues = z.infer<typeof valleyDetailsSchema>;

// 2. RequestDetailsSection Component
const RequestDetailsSection = ({ 
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
      <h3 className="text-lg font-medium">Expense Details</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/10">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Basic Information</h4>
          
          <div className="space-y-4">
            {/* Project selection */}
            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  {readOnly ? (
                    <Input 
                      {...field} 
                      readOnly 
                      className="bg-muted/30" 
                      value={projectOptions.find(p => p.value === field.value)?.label || field.value}
                    />
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
                      <Input {...field} placeholder="Enter project name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Purpose of expense */}
            <FormField
              control={form.control}
              name="purposeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Expense</FormLabel>
                  {readOnly ? (
                    <Input 
                      {...field} 
                      readOnly 
                      className="bg-muted/30" 
                      value={valleyPurposeOptions.find(p => p.value === field.value)?.label || field.value}
                    />
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
                        {valleyPurposeOptions.map(option => (
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
            
            {!readOnly && form.watch('purposeType') === 'other' && (
              <FormField
                control={form.control}
                name="purposeOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Purpose</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter purpose" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Expense Date */}
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Expense Date</span>
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
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter location in the valley" 
                      readOnly={readOnly}
                      className={readOnly ? "bg-muted/30" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/10">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Additional Details</h4>
          
          <div className="space-y-4">
            {/* Meeting Type - Conditionally shown if purpose is meeting */}
            {(readOnly || form.watch('purposeType') === 'meeting') && (
              <>
                <FormField
                  control={form.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      {readOnly ? (
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-muted/30" 
                          value={meetingTypeOptions.find(m => m.value === field.value)?.label || field.value}
                        />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meeting type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {meetingTypeOptions.map(option => (
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
                
                <FormField
                  control={form.control}
                  name="meetingParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Meeting Participants</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="List the names of participants" 
                          className="resize-none min-h-[80px]"
                          readOnly={readOnly}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Provide details about the expense" 
                      className="resize-none min-h-[100px]"
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Method</span>
                  </FormLabel>
                  {readOnly ? (
                    <Input 
                      {...field} 
                      readOnly 
                      className="bg-muted/30" 
                      value={paymentMethodOptions.find(p => p.value === field.value)?.label || field.value}
                    />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodOptions.map(option => (
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
            
            {!readOnly && form.watch('paymentMethod') === 'other' && (
              <FormField
                control={form.control}
                name="paymentMethodOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Payment Method</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter payment method" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 3. ApproverSelectionSection Component
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
            This person will review and approve your expense request
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

// =============== MAIN COMPONENT ===============
export default function InValleyRequestForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [approverOptions, setApproverOptions] = useState<ApproverOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [phase, setPhase] = useState<1 | 2>(1);  // Phase 1: Request Details, Phase 2: Expenses
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  
  // Initialize form for Phase 1
  const valleyDetailsForm = useForm<ValleyDetailsFormValues>({
    resolver: zodResolver(valleyDetailsSchema) as any,
    defaultValues: {
      employeeId: '',
      employeeName: '',
      department: '',
      designation: '',
      project: '',
      projectOther: '',
      purposeType: '',
      purposeOther: '',
      expenseDate: new Date().toISOString().split('T')[0], // Today's date as default
      meetingType: '',
      meetingParticipants: '',
      location: '',
      description: '',
      paymentMethod: '',
      paymentMethodOther: '',
      approverId: '',
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
          const response = await fetch(`/api/valley-requests/${id}`);
          if (response.ok) {
            const data = await response.json();
            setRequestDetails(data);
            console.log("Fetched valley request details:", data);
          } else {
            console.error('Failed to fetch valley request details');
            router.push('/employee/dashboard');
          }
        } catch (error) {
          console.error('Error fetching valley request details:', error);
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
    
    fetchApprovers();
  }, []);
  
  // Update employeeId and prefill form with session data when available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setEmployeeId(session.user.id);
      valleyDetailsForm.setValue('employeeId', session.user.id);
      
      if (session.user.name) {
        valleyDetailsForm.setValue('employeeName', session.user.name);
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
              valleyDetailsForm.setValue('department', userData.department);
            }
            if (userData.designation) {
              valleyDetailsForm.setValue('designation', userData.designation);
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
  }, [session, status, valleyDetailsForm]);
  
  // Phase 1 form submission
  const onSubmitValleyDetails = async (data: ValleyDetailsFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the request data
      const finalEmployeeId = employeeId || data.employeeId || uuidv4();
      
      // Format the date
      const formattedExpenseDate = data.expenseDate;
      
      // Modify data to match the API expectations
      const requestData = {
        ...data,
        employeeId: finalEmployeeId,
        phase: 1,
        requestType: 'in-valley', // Set request type to in-valley
        purpose: data.purposeType === 'other' ? data.purposeOther : data.purposeType,
        expenseDate: formattedExpenseDate,
        travelDateFrom: formattedExpenseDate, // Use expense date for both fields
        travelDateTo: formattedExpenseDate,   // to maintain compatibility with existing API
        totalAmount: 0, // No expenses yet in Phase 1
        status: 'pending' as const,
      };
      
      console.log('Submitting in-valley request with data:', requestData);
      
      // Create the in-valley request
      const response = await fetch('/api/valley-requests', {
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
      console.log('In-valley request created:', createdRequest);
      
      // Navigate to dashboard on success
      router.push('/employee/dashboard?success=valley_details_submitted');
      
    } catch (error) {
      console.error('Error submitting in-valley details:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="max-w-5xl mx-auto bg-background shadow-md">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-2xl flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {phase === 1 
            ? "In-Valley Reimbursement Form" 
            : "In-Valley Expense Submission"}
        </CardTitle>
        <CardDescription>
          {phase === 1 
            ? "Submit reimbursement requests for expenses within the city" 
            : "Add your expenses and upload receipts for your approved in-valley request"}
        </CardDescription>
      </CardHeader>
      
      {phase === 1 ? (
        // Phase 1: Valley Request Details Form
        <Form {...valleyDetailsForm}>
          <form onSubmit={valleyDetailsForm.handleSubmit(onSubmitValleyDetails)}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Employee Information Section */}
                <EmployeeInfoSection form={valleyDetailsForm} />
                
                {/* Request Details Section */}
                <RequestDetailsSection 
                  form={valleyDetailsForm} 
                  projectOptions={projectOptions}
                  loadingProjects={loadingProjects}
                />
                
                {/* Approver Selection Section */}
                <ApproverSelectionSection 
                  form={valleyDetailsForm}
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
                    Submit Request
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      ) : (
        // Phase 2: Expenses Form - Use our shared ExpenseSubmissionForm component
        <ExpenseSubmissionForm 
          requestId={requestId!} 
          requestType="in-valley"
          categoryOptions={valleyExpenseCategoryOptions}
          showPreviousAdvance={false}
        />
      )}
    </Card>
  );
}