'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseCategory, TravelRequest } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
// Removed date-fns and Calendar imports
import { CalendarIcon, CheckCircle2, FileText, Loader2, PaperclipIcon, UserIcon, CreditCard, MapPin, Receipt } from "lucide-react";

interface ExpenseItemFormData {
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

export default function TravelRequestForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeId: '123', // Hardcoded for now, would come from auth
    employeeName: '',
    department: '',
    designation: '',
    purpose: '',
    travelDateFrom: '',
    travelDateTo: '',
    previousOutstandingAdvance: 0,
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
      // 1. Create the travel request
      const requestData = {
        ...formData,
        totalAmount: calculateTotalAmount(),
        status: 'pending' as const,
      };
      
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create travel request');
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="employee">Employee Information</TabsTrigger>
              <TabsTrigger value="travel">Travel Details</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            
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
