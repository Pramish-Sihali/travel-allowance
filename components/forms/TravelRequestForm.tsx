'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { 
  FileText, 
  Loader2, 
  CheckCircle2,
} from "lucide-react";

// Import shared components
import EmployeeInfoSection from '@/components/forms/EmployeeInfoSection';
import ExpenseSubmissionForm from '@/components/forms/ExpenseSubmissionForm';

// Import our modular components
import RequestTypeSection from '@/components/forms/RequestTypeSection';
import GroupTravelSection from '@/components/forms/GroupTravelSection';
import TravelDetailsSection from '@/components/forms/TravelDetailsSection';
import ApproverSelectionSection from '@/components/forms/ApproverSelectionSection';

// Import constants
import { expenseCategoryOptions } from "./constants";

// Define types
interface ProjectOption {
  value: string;
  label: string;
}

interface ApproverOption {
  value: string;
  label: string;
  email?: string;
}

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
  estimatedAmount: z.string().optional(),
  advanceNotes: z.string().optional(),
  
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
)
.refine(
  (data) => {
    // If it's an advance request, estimated amount should be provided
    if (data.requestType === "advance" && (!data.estimatedAmount || parseFloat(data.estimatedAmount) <= 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Please provide an estimated amount for your advance request",
    path: ["estimatedAmount"],
  }
);

// Define Zod schema for expenses (Phase 2)
const expensesSchema = z.object({
  previousOutstandingAdvance: z.coerce.number().default(0),
});

// Infer the types from the schemas
type TravelDetailsFormValues = z.infer<typeof travelDetailsSchema>;
type ExpensesFormValues = z.infer<typeof expensesSchema>;

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
      estimatedAmount: '',
      advanceNotes: '',
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
        const response = await fetch('/api/users/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        
        const data = await response.json();
        
        // Transform users into options format
        const options: UserOption[] = data.map((user: any) => ({
          id: user.id,
          name: user.name || 'Unnamed User',
          email: user.email,
          department: user.department,
          designation: user.designation
        }));
        
        console.log('Fetched employee options:', options);
        setUserOptions(options);
      } catch (error) {
        console.error('Error fetching employees:', error);
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
  
  // Load group members if we have them in the form
  useEffect(() => {
    const loadGroupMembers = async () => {
      const groupMembers = travelDetailsForm.watch('groupMembers');
      if (groupMembers && Array.isArray(groupMembers) && groupMembers.length > 0) {
        try {
          // First try to load members from our db-helpers
          const queryString = new URLSearchParams();
          groupMembers.forEach(id => queryString.append('ids', id));
          const response = await fetch(`/api/users/by-ids?${queryString.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            setSelectedMembers(data);
          } else {
            console.error('Failed to load group members');
          }
        } catch (error) {
          console.error('Error loading group members:', error);
        }
      }
    };
    
    if (travelDetailsForm.watch('requestType') === 'group' && 
        travelDetailsForm.watch('isGroupCaptain')) {
      loadGroupMembers();
    }
  }, [travelDetailsForm.watch('groupMembers')]);
  
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