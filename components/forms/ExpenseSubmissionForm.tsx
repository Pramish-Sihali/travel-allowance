'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  Loader2,
  CheckCircle2,
} from 'lucide-react';

// Import constants
import { valleyExpenseCategoryOptions } from "./valley-constants";
import { expenseCategoryOptions } from "./constants";

// Import shared expense section component
import SharedExpenseSection, { ExpenseItemFormData } from '@/components/forms/SharedExpenseSection';

// Define Zod schema for expenses
const expensesSchema = z.object({
  previousOutstandingAdvance: z.coerce.number().default(0),
});

// Infer the type from the schema
type ExpensesFormValues = z.infer<typeof expensesSchema>;

interface ExpenseSubmissionFormProps {
  requestId: string;
  requestType: 'travel' | 'in-valley';
  categoryOptions?: Array<{ value: string; label: string }>;
  showPreviousAdvance?: boolean;
}

const ExpenseSubmissionForm: React.FC<ExpenseSubmissionFormProps> = ({
  requestId,
  requestType,
  categoryOptions,
  showPreviousAdvance = true
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [approverComments, setApproverComments] = useState<string>('');
  
  // Expense items state
  const [expenseItems, setExpenseItems] = useState<ExpenseItemFormData[]>([
    { 
      category: requestType === 'travel' ? 'accommodation' : 'ride-share', 
      amount: 0, 
      description: '' 
    },
  ]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  
  // Get the appropriate expense categories based on request type
  const getExpenseCategoryOptions = () => {
    if (categoryOptions) {
      return categoryOptions;
    }
    return requestType === 'travel' ? expenseCategoryOptions : valleyExpenseCategoryOptions;
  };
  
  // Initialize form for expenses
  const expensesForm = useForm<ExpensesFormValues>({
    resolver: zodResolver(expensesSchema) as any,
    defaultValues: {
      previousOutstandingAdvance: 0,
    },
  });
  
  // Fetch request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        // Determine the API endpoint based on request type
        const endpoint = requestType === 'travel' 
          ? `/api/requests/${requestId}`
          : `/api/valley-requests/${requestId}`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setRequestDetails(data);
          
          if (data.approverComments) {
            setApproverComments(data.approverComments);
          }
          
          // Set previous outstanding advance if available and we're showing it
          if (showPreviousAdvance && data.previousOutstandingAdvance !== undefined) {
            expensesForm.setValue('previousOutstandingAdvance', data.previousOutstandingAdvance);
          }
        } else {
          console.error('Failed to fetch request details');
          router.push('/employee/dashboard');
        }
      } catch (error) {
        console.error(`Error fetching ${requestType} request details:`, error);
        router.push('/employee/dashboard');
      }
    };
    
    fetchRequestDetails();
  }, [requestId, requestType, expensesForm, router, showPreviousAdvance]);
  
  // Function to add a new expense item
  const addExpenseItem = () => {
    const defaultCategory = requestType === 'travel' ? 'accommodation' : 'ride-share';
    setExpenseItems([...expenseItems, { category: defaultCategory, amount: 0, description: '' }]);
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
  const onSubmitExpenses = async (data: ExpensesFormValues) => {
    if (!requestId) {
      alert('No request ID found. Please try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare update data for request
      const updateData: {
        phase: number;
        totalAmount: number;
        status: string;
        expenses_submitted_at: string;
        previousOutstandingAdvance?: number;
      } = {
        phase: 2,
        totalAmount: calculateTotalAmount(),
        status: 'pending_verification',
        expenses_submitted_at: new Date().toISOString(),
      };
      
      // Add previousOutstandingAdvance if we're showing it and have a value
      if (showPreviousAdvance) {
        updateData.previousOutstandingAdvance = data.previousOutstandingAdvance;
      }
      
      console.log(`Updating ${requestType} request with expenses:`, updateData);
      
      // Determine API endpoint based on request type
      const updateEndpoint = requestType === 'travel' 
        ? `/api/requests/${requestId}/expenses`
        : `/api/valley-requests/${requestId}/expenses`;
      
      // Update the request
      const response = await fetch(updateEndpoint, {
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
      
      await response.json();
      
      // Create expense items
      const expenseEndpoint = requestType === 'travel' ? '/api/expenses' : '/api/valley-expenses';
      
      for (const expenseItem of expenseItems) {
        if (expenseItem.amount > 0) {
          console.log('Creating expense item:', expenseItem);
          
          const expenseResponse = await fetch(expenseEndpoint, {
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
            throw new Error(`Failed to create ${requestType} expense item`);
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
      console.error(`Error submitting ${requestType} expenses:`, error);
      alert('There was an error submitting your expenses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...expensesForm}>
      <form onSubmit={expensesForm.handleSubmit(onSubmitExpenses)}>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-6">
            {/* Show approver comments if available */}
            {approverComments && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <div className="flex items-center text-green-700 mb-2">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Approved Request</h3>
                </div>
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Approver Comments:</p>
                  <p>{approverComments}</p>
                </div>
              </div>
            )}
            
            {/* Expenses Section */}
            <SharedExpenseSection
              form={showPreviousAdvance ? expensesForm : undefined}
              expenseItems={expenseItems}
              addExpenseItem={addExpenseItem}
              removeExpenseItem={removeExpenseItem}
              handleExpenseChange={handleExpenseChange}
              handleFileChange={handleFileChange}
              selectedFiles={selectedFiles}
              calculateTotalAmount={calculateTotalAmount}
              categoryOptions={getExpenseCategoryOptions()}
              showPreviousAdvance={showPreviousAdvance}
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
  );
};

export default ExpenseSubmissionForm;