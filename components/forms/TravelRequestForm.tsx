'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseCategory, RequestType, TravelRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, FileText, Loader2, PaperclipIcon, UserIcon, CreditCard, MapPin, Receipt, AlertTriangle, Clock } from "lucide-react";

interface ExpenseItemFormData {
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

export default function TravelRequestForm() {
  const { data: session, status } = useSession();
  // Generate a UUID immediately to ensure we always have one, even if session isn't loaded yet
  const [employeeId, setEmployeeId] = useState<string>(uuidv4());
  
  // Update employeeId if session loads and has a user id
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setEmployeeId(session.user.id);
    }
  }, [session, status]);

  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeId: '', // We'll set this right before submission
    employeeName: '',
    department: '',
    designation: '',
    purpose: '',
    travelDateFrom: '',
    travelDateTo: '',
    previousOutstandingAdvance: 0,
    requestType: 'normal' as RequestType, // Default to normal request
  });
  
  const [expenseItems, setExpenseItems] = useState<ExpenseItemFormData[]>([
    { category: 'accommodation', amount: 0, description: '' },
    { category: 'per-diem', amount: 0, description: '' },
    { category: 'vehicle-hiring', amount: 0, description: '' },
    { category: 'program-cost', amount: 0, description: '' },
    { category: 'meeting-cost', amount: 0, description: '' },
  ]);
  
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, requestType: value as RequestType }));
  };
  
  const handleExpenseChange = (index: number, field: keyof ExpenseItemFormData, value: any) => {
    const updatedExpenses = [...expenseItems];
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value };
    setExpenseItems(updatedExpenses);
  };
  
  const handleFileChange = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => ({
        ...prev,
        [category]: e.target.files![0]
      }));
    }
  };
  
  const calculateTotalAmount = () => {
    return expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleTravelDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, travelDateFrom: e.target.value }));
  };

  const handleTravelDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, travelDateTo: e.target.value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Ensure we have a valid UUID for employeeId
      const finalEmployeeId = employeeId || uuidv4();
      
      // 1. Create the travel request with guaranteed valid UUID
      const requestData = {
        ...formData,
        employeeId: finalEmployeeId, // Use our guaranteed UUID
        totalAmount: calculateTotalAmount(),
        status: 'pending' as const,
      };
      
      console.log('Submitting request with data:', requestData);
      
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
      
      const createdRequest: TravelRequest = await response.json();
      
      // 2. Create expense items
      for (const expenseItem of expenseItems) {
        if (expenseItem.amount > 0) {
          const expenseResponse = await fetch('/api/expenses', {
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
          
          // 3. Upload receipt if available
          const file = selectedFiles[expenseItem.category];
          if (file) {
            const formDataFile = new FormData();
            formDataFile.append('file', file);
            formDataFile.append('expenseItemId', createdExpense.id);
            
            const uploadResponse = await fetch('/api/receipts/upload', {
              method: 'POST',
              body: formDataFile,
            });
            
            if (!uploadResponse.ok) {
              throw new Error('Failed to upload receipt');
            }
          }
        }
      }
      
      // Navigate to dashboard instead of requests page
      router.push('/employee/dashboard');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'accommodation':
        return <Receipt className="h-4 w-4" />;
      case 'per-diem':
        return <CreditCard className="h-4 w-4" />;
      case 'vehicle-hiring':
        return <MapPin className="h-4 w-4" />;
      case 'program-cost':
        return <FileText className="h-4 w-4" />;
      case 'meeting-cost':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getRequestTypeDescription = () => {
    switch(formData.requestType) {
      case 'normal':
        return "Standard travel request with regular processing time.";
      case 'advance':
        return "Request funds in advance of travel dates.";
      case 'emergency':
        return "Urgent request requiring immediate attention and quick processing.";
      default:
        return "";
    }
  };

  const getRequestTypeIcon = () => {
    switch(formData.requestType) {
      case 'normal':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'advance':
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Travel Request Form</CardTitle>
        <CardDescription>
          Submit your travel expense reimbursement request
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Tabs defaultValue="employee" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requestType">Request Type</TabsTrigger>
              <TabsTrigger value="employee">Employee Information</TabsTrigger>
              <TabsTrigger value="travel">Travel Details</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            
            {/* Request Type Tab */}
            <TabsContent value="requestType" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getRequestTypeIcon()}
                  <p className="text-sm text-muted-foreground">{getRequestTypeDescription()}</p>
                </div>
                
                <RadioGroup 
                  value={formData.requestType} 
                  onValueChange={handleRequestTypeChange}
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
                
                <div className="flex gap-4 mt-6 pt-4 border-t">
                  <div className={cn(
                    "p-4 rounded-md flex-1",
                    formData.requestType === 'normal' && "bg-blue-50 border border-blue-100",
                    formData.requestType === 'advance' && "bg-green-50 border border-green-100",
                    formData.requestType === 'emergency' && "bg-red-50 border border-red-100",
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {formData.requestType === 'normal' && <Clock className="h-4 w-4 text-blue-500" />}
                      {formData.requestType === 'advance' && <CreditCard className="h-4 w-4 text-green-500" />}
                      {formData.requestType === 'emergency' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <h4 className={cn(
                        "text-sm font-medium",
                        formData.requestType === 'normal' && "text-blue-700",
                        formData.requestType === 'advance' && "text-green-700",
                        formData.requestType === 'emergency' && "text-red-700",
                      )}>
                        {formData.requestType.charAt(0).toUpperCase() + formData.requestType.slice(1)} Request Details
                      </h4>
                    </div>
                    
                    <p className={cn(
                      "text-xs",
                      formData.requestType === 'normal' && "text-blue-600",
                      formData.requestType === 'advance' && "text-green-600",
                      formData.requestType === 'emergency' && "text-red-600",
                    )}>
                      {formData.requestType === 'normal' && (
                        "Regular travel requests are processed within 3-5 business days. Ideal for planned travel where there is adequate time for approval."
                      )}
                      {formData.requestType === 'advance' && (
                        "Advance requests allow you to receive funds before travel. This request type requires at least 7 business days of processing time before your travel date."
                      )}
                      {formData.requestType === 'emergency' && (
                        "Emergency requests are processed within 24 hours. This option should only be used for genuine urgent travel needs and requires additional justification."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Employee Information Tab */}
            <TabsContent value="employee" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Full Name</Label>
                  <Input
                    id="employeeName"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Your department"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Your job title"
                    required
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Travel Details Tab */}
            <TabsContent value="travel" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Travel</Label>
                  <Textarea
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="Describe the purpose of your travel"
                    className="min-h-32"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="travelDateFrom">Travel Date From</Label>
                    <Input
                      type="date"
                      id="travelDateFrom"
                      name="travelDateFrom"
                      value={formData.travelDateFrom}
                      onChange={handleTravelDateFromChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travelDateTo">Travel Date To</Label>
                    <Input
                      type="date"
                      id="travelDateTo"
                      name="travelDateTo"
                      value={formData.travelDateTo}
                      onChange={handleTravelDateToChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="previousOutstandingAdvance">Previous Outstanding Advance (if any)</Label>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <Input
                    id="previousOutstandingAdvance"
                    name="previousOutstandingAdvance"
                    type="number"
                    value={formData.previousOutstandingAdvance}
                    onChange={handleChange}
                    className="max-w-xs"
                    min="0"
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description (Optional)</TableHead>
                      <TableHead>Receipts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            <span>
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2">$</span>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value))}
                              className="max-w-24"
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
                            <Label
                              htmlFor={`receipt-${item.category}`}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 px-2 py-1 border rounded-md hover:bg-accent">
                                <PaperclipIcon className="h-4 w-4" />
                                <span>Upload</span>
                              </div>
                            </Label>
                            <Input
                              id={`receipt-${item.category}`}
                              type="file"
                              onChange={(e) => handleFileChange(item.category, e)}
                              className="hidden"
                            />
                            {selectedFiles[item.category] && (
                              <div className="flex items-center text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-[12rem]">
                                  {selectedFiles[item.category]?.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-1">$</span>
                          <span>{calculateTotalAmount().toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}