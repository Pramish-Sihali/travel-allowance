// components/forms/TravelRequestForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseCategory, TravelRequest } from '@/types';

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
            const formData = new FormData();
            formData.append('file', file);
            formData.append('expenseItemId', createdExpense.id);
            
            const uploadResponse = await fetch('/api/receipts/upload', {
              method: 'POST',
              body: formData,
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
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Travel Request Form</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Employee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Name</label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Travel Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Purpose of Travel</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div className="flex flex-col">
              <div className="mb-4">
                <label className="block mb-1">Travel Date From</label>
                <input
                  type="date"
                  name="travelDateFrom"
                  value={formData.travelDateFrom}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Travel Date To</label>
                <input
                  type="date"
                  name="travelDateTo"
                  value={formData.travelDateTo}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Expense Details</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Previous Outstanding Advance (if any)</label>
            <input
              type="number"
              name="previousOutstandingAdvance"
              value={formData.previousOutstandingAdvance}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">Category</th>
                  <th className="p-2 text-left border">Amount</th>
                  <th className="p-2 text-left border">Description (Optional)</th>
                  <th className="p-2 text-left border">Receipts</th>
                </tr>
              </thead>
              <tbody>
                {expenseItems.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2 border">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value))}
                        className="w-full p-1 border rounded"
                        min="0"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(item.category, e)}
                        className="w-full p-1"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="p-2 border">Total</td>
                  <td className="p-2 border">{calculateTotalAmount()}</td>
                  <td colSpan={2} className="p-2 border"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 mr-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}