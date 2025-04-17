'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  PaperclipIcon,
  TrashIcon,
  UserIcon, 
  CheckCircle2,
  Building,
  BriefcaseBusiness,
  BadgeInfo,
  DollarSign,
  Calendar,
  CreditCard,
  Users,
  MapPin,
  Plus,
  Trash2,
  Receipt,
  Coffee,
  Car
} from "lucide-react";

// Purpose options for in-valley reimbursements
const valleyPurposeOptions = [
  { value: "meeting", label: "Business Meeting", icon: <Users className="h-4 w-4" /> },
  { value: "office-supplies", label: "Office Supplies", icon: <FileText className="h-4 w-4" /> },
  { value: "lunch", label: "Lunch/Dinner with Clients", icon: <Coffee className="h-4 w-4" /> },
  { value: "local-transport", label: "Local Transportation", icon: <Car className="h-4 w-4" /> },
  { value: "refreshments", label: "Team Refreshments", icon: <Coffee className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <FileText className="h-4 w-4" /> },
];

// Expense category options for in-valley
const valleyExpenseCategoryOptions = [
  { value: "ride-share", label: "Ride Share Service" },
  { value: "taxi", label: "Taxi" },
  { value: "food", label: "Food & Beverages" },
  { value: "meeting-venue", label: "Meeting Venue" },
  { value: "stationery", label: "Stationery & Supplies" },
  { value: "printing", label: "Printing & Photocopying" },
  { value: "courier", label: "Courier & Postage" },
  { value: "other", label: "Other" },
];

// Meeting types for in-valley reimbursements
const meetingTypeOptions = [
  { value: "internal", label: "Internal Team Meeting" },
  { value: "client", label: "Client Meeting" },
  { value: "vendor", label: "Vendor Meeting" },
  { value: "interview", label: "Interview" },
  { value: "other", label: "Other" },
];

// Payment methods
const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "personal-card", label: "Personal Credit/Debit Card" },
  { value: "company-card", label: "Company Card" },
  { value: "digital-wallet", label: "Digital Wallet" },
  { value: "other", label: "Other" },
];

// Define project type
interface ProjectOption {
  value: string;
  label: string;
}

// =============== SCHEMA & TYPES ===============
// Define Zod schema for form validation
const inValleyRequestSchema = z.object({
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

// Expense item type
interface ExpenseItemFormData {
  category: string;
  amount: number;
  description?: string;
}

// Infer the type from the schema
type FormValues = z.infer<typeof inValleyRequestSchema>;

// =============== COMPONENTS ===============

// 1. EmployeeInfoSection Component
const EmployeeInfoSection = ({ form }: { form: any }) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <UserIcon className="h-5 w-5 text-primary mr-2" />
      <h3 className="text-lg font-medium">Employee Information</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormField
        control={form.control}
        name="employeeName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <BadgeInfo className="h-4 w-4 mr-2 text-muted-foreground" />
              Full Name
            </FormLabel>
            <FormControl>
              <Input {...field} readOnly className="bg-muted/30" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
              Department
            </FormLabel>
            <FormControl>
              <Input {...field} readOnly className="bg-muted/30" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="designation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <BriefcaseBusiness className="h-4 w-4 mr-2 text-muted-foreground" />
              Designation
            </FormLabel>
            <FormControl>
              <Input {...field} readOnly className="bg-muted/30" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);

// 2. RequestDetailsSection Component
const RequestDetailsSection = ({ form, projectOptions, loadingProjects }: { form: any, projectOptions: ProjectOption[], loadingProjects: boolean }) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <Receipt className="h-5 w-5 text-primary mr-2" />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingProjects}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('project') === 'other' && (
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('purposeType') === 'other' && (
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
                    <Input {...field} placeholder="Enter location in the valley" />
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
            {form.watch('purposeType') === 'meeting' && (
              <>
                <FormField
                  control={form.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('paymentMethod') === 'other' && (
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

// 3. ExpensesSection Component
const ExpensesSection = ({ 
  expenseItems,
  addExpenseItem,
  removeExpenseItem,
  handleExpenseChange,
  handleFileChange,
  selectedFiles,
  calculateTotalAmount 
}: { 
  expenseItems: ExpenseItemFormData[],
  addExpenseItem: () => void,
  removeExpenseItem: (index: number) => void,
  handleExpenseChange: (index: number, field: keyof ExpenseItemFormData, value: any) => void,
  handleFileChange: (category: string, e: React.ChangeEvent<HTMLInputElement>) => void,
  selectedFiles: Record<string, File | null>,
  calculateTotalAmount: () => number
}) => (
  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <Receipt className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium">Expense Items</h3>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={addExpenseItem}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        Add Item
      </Button>
    </div>
    
    <div className="rounded-md border overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead className="w-[80px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenseItems.map((item, index) => (
            <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/10"}>
              <TableCell>
                <Select
                  value={item.category}
                  onValueChange={(value) => handleExpenseChange(index, 'category', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {valleyExpenseCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span className="px-2 py-2 bg-muted border-y border-l rounded-l-md text-muted-foreground text-xs">Nrs.</span>
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="max-w-24 rounded-l-none"
                    min="0"
                    step="0.01"
                  />
                </div>
              </TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={item.description || ''}
                  onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                  placeholder="Brief description"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`receipt-${index}`}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 px-2 py-1 border rounded-md hover:bg-accent text-sm">
                      <PaperclipIcon className="h-4 w-4" />
                      <span>Upload</span>
                    </div>
                  </label>
                  <input
                    id={`receipt-${index}`}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(`${item.category}-${index}`, e)}
                    className="hidden"
                  />
                  {selectedFiles[`${item.category}-${index}`] && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate max-w-[6rem] text-xs">
                        {selectedFiles[`${item.category}-${index}`]?.name}
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {expenseItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExpenseItem(index)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-medium bg-muted/20">
            <TableCell colSpan={1} className="text-right">Total Amount</TableCell>
            <TableCell>
              <div className="flex items-center font-bold">
                <span className="mr-1">Nrs.</span>
                <span>{calculateTotalAmount().toFixed(2)}</span>
              </div>
            </TableCell>
            <TableCell colSpan={3}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
);

// =============== MAIN COMPONENT ===============
export default function InValleyRequestForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState<string>(uuidv4());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [expenseItems, setExpenseItems] = useState<ExpenseItemFormData[]>([
    { category: 'ride-share', amount: 0, description: '' },
  ]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  
  // Initialize form with react-hook-form and zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(inValleyRequestSchema) as any,
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
    },
  });
  
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
  
  // Update employeeId and prefill form with session data when available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setEmployeeId(session.user.id);
      form.setValue('employeeId', session.user.id);
      
      if (session.user.name) {
        form.setValue('employeeName', session.user.name);
      }
      
      // You would typically fetch these from a user profile API
      // For now, we'll set some demo values
      form.setValue('department', 'Engineering');
      form.setValue('designation', 'Software Engineer');
    }
  }, [session, status, form]);
  
  // Function to add a new expense item
  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { category: 'ride-share', amount: 0 }]);
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
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the request data
      const finalEmployeeId = employeeId || uuidv4();
      
      // Format the date
      const formattedExpenseDate = data.expenseDate;
      
      // Modify data to match the API expectations
      const requestData = {
        ...data,
        employeeId: finalEmployeeId,
        requestType: 'in-valley', // Set request type to in-valley
        purpose: data.purposeType === 'other' ? data.purposeOther : data.purposeType,
        expenseDate: formattedExpenseDate,
        travelDateFrom: formattedExpenseDate, // Use expense date for both fields
        travelDateTo: formattedExpenseDate,   // to maintain compatibility with existing API
        totalAmount: calculateTotalAmount(),
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
      
      for (const expenseItem of expenseItems) {
        if (expenseItem.amount > 0) {
          console.log('Creating expense item:', expenseItem);
          
          const expenseResponse = await fetch('/api/valley-expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...expenseItem,
              requestId: createdRequest.id,
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
      router.push('/employee/dashboard');
      
    } catch (error) {
      console.error('Error submitting form:', error);
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
          In-Valley Reimbursement Form
        </CardTitle>
        <CardDescription>
          Submit reimbursement requests for expenses within the city
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Employee Information Section */}
              <EmployeeInfoSection form={form} />
              
              {/* Request Details Section */}
              <RequestDetailsSection 
                form={form} 
                projectOptions={projectOptions}
                loadingProjects={loadingProjects}
              />
              
              {/* Expenses Section */}
              <ExpensesSection 
                expenseItems={expenseItems}
                addExpenseItem={addExpenseItem}
                removeExpenseItem={removeExpenseItem}
                handleExpenseChange={handleExpenseChange}
                handleFileChange={handleFileChange}
                selectedFiles={selectedFiles}
                calculateTotalAmount={calculateTotalAmount}
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
    </Card>
  );
}