// components/dashboard/EmployeeRequestDetail.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest, ExpenseItem, Receipt } from '@/types';

interface EmployeeRequestDetailProps {
  requestId: string;
}

export default function EmployeeRequestDetail({ requestId }: EmployeeRequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        // Fetch request
        const requestResponse = await fetch(`/api/requests/${requestId}`);
        if (!requestResponse.ok) {
          throw new Error('Failed to fetch request details');
        }
        const requestData = await requestResponse.json();
        setRequest(requestData);
        
        // Fetch expense items
        const expensesResponse = await fetch(`/api/expenses?requestId=${requestId}`);
        if (!expensesResponse.ok) {
          throw new Error('Failed to fetch expense items');
        }
        const expensesData = await expensesResponse.json();
        setExpenseItems(expensesData);
        
        // Fetch receipts for each expense item
        const receiptsMap: Record<string, Receipt[]> = {};
        for (const expense of expensesData) {
          const receiptsResponse = await fetch(`/api/receipts?expenseItemId=${expense.id}`);
          if (receiptsResponse.ok) {
            const receiptsData = await receiptsResponse.json();
            receiptsMap[expense.id] = receiptsData;
          }
        }
        setReceipts(receiptsMap);
      } catch (error) {
        console.error('Error fetching request details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [requestId]);
  
  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  if (!request) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Request not found or you don't have permission to view it.</p>
        <button
          onClick={() => router.push('/employee/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Travel Request Details</h1>
        <div>
          <span className={`px-3 py-1 rounded ${
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Travel Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-gray-600">Purpose</p>
            <p className="font-medium">{request.purpose}</p>
          </div>
          <div>
            <p className="text-gray-600">Travel Dates</p>
            <p className="font-medium">
              {new Date(request.travelDateFrom).toLocaleDateString()} - {new Date(request.travelDateTo).toLocaleDateString()}
            </p>
          </div>
          {request.previousOutstandingAdvance ? (
            <div>
              <p className="text-gray-600">Previous Outstanding Advance</p>
              <p className="font-medium">{request.previousOutstandingAdvance}</p>
            </div>
          ) : null}
          <div>
            <p className="text-gray-600">Submission Date</p>
            <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Expense Details</h2>
        
        {expenseItems.length === 0 ? (
          <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">No expense items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">Category</th>
                  <th className="p-2 text-left border">Description</th>
                  <th className="p-2 text-left border">Amount</th>
                  <th className="p-2 text-left border">Receipts</th>
                </tr>
              </thead>
              <tbody>
                {expenseItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2 border">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                    </td>
                    <td className="p-2 border">{item.description || '-'}</td>
                    <td className="p-2 border">{item.amount.toFixed(2)}</td>
                    <td className="p-2 border">
                      {receipts[item.id] && receipts[item.id].length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {receipts[item.id].map((receipt) => (
                            <a
                              key={receipt.id}
                              href={`/uploads/${receipt.storedFilename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {receipt.originalFilename}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No receipts</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td colSpan={2} className="p-2 border text-right">Total</td>
                  <td className="p-2 border">{request.totalAmount.toFixed(2)}</td>
                  <td className="p-2 border"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {request.status === 'rejected' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Rejection Information</h3>
          <p className="text-red-700">
            Your travel request has been rejected. Please contact your supervisor for more information.
          </p>
        </div>
      )}
      
      {request.status === 'approved' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Approval Information</h3>
          <p className="text-green-700">
            Your travel request has been approved. Please collect your advance from the Finance department.
          </p>
          <p className="mt-2 text-green-700">
            Remember to submit all receipts within 3 days of returning from your travel.
          </p>
        </div>
      )}
      
      {request.status === 'pending' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Request Status</h3>
          <p className="text-yellow-700">
            Your travel request is pending approval. You will be notified when it is reviewed.
          </p>
        </div>
      )}
    </div>
  );
}