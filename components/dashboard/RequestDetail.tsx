'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest, ExpenseItem, Receipt } from '@/types';
import { 
  ArrowLeft, Calendar, DollarSign, FileText, Paperclip, 
  Clock, CheckCircle, AlertTriangle, Download, Briefcase,
  User, MapPin, Building, CreditCard, Users, ChevronsUpDown,
  ThumbsUp, ThumbsDown, Eye, MessageCircle
} from 'lucide-react';

interface RequestDetailProps {
  requestId: string;
}

export default function RequestDetail({ requestId }: RequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('expense');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
  
  const handleApproveReject = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comments: approvalComment,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${status} request`);
      }
      
      const updatedRequest = await response.json();
      setRequest(updatedRequest);
      
      // Show success message in the UI
      setSuccessMessage(`Request has been ${status} successfully. Redirecting...`);
      
      // Display success state for 2 seconds before navigating
      setTimeout(() => {
        router.push('/approver/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      setErrorMessage(`There was an error ${status === 'approved' ? 'approving' : 'rejecting'} the request. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <div className="bg-red-100 inline-block p-4 rounded-full mb-4">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Not Found</h2>
          <p className="text-red-500 mb-6">Request not found or you don't have permission to view it.</p>
          <button
            onClick={() => router.push('/approver/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const travelDates = {
    start: new Date(request.travelDateFrom),
    end: new Date(request.travelDateTo),
    duration: Math.ceil((new Date(request.travelDateTo).getTime() - new Date(request.travelDateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
  };
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg flex items-center shadow-sm">
          <CheckCircle size={20} className="mr-2 text-green-600" />
          <p>{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center shadow-sm">
          <AlertTriangle size={20} className="mr-2 text-red-600" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push('/approver/dashboard')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(request.status)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(request.status)}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h1 className="text-2xl font-bold mb-2">Travel Request Review</h1>
          <p className="text-blue-100">Request #{requestId.substring(0, 8)}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <button 
                className="flex items-center justify-between w-full text-lg font-semibold mb-4 text-gray-800 hover:text-blue-600 transition-colors"
                onClick={() => toggleSection('employee')}
              >
                <div className="flex items-center">
                  <User size={20} className="mr-2 text-blue-600" />
                  Employee Information
                </div>
                <ChevronsUpDown size={20} className={`transition-transform duration-200 ${expandedSection === 'employee' ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSection === 'employee' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">Name</p>
                      <p className="font-medium text-gray-800">{request.employeeName}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">Department</p>
                      <p className="font-medium text-gray-800">{request.department}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">Designation</p>
                      <p className="font-medium text-gray-800">{request.designation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <button 
                className="flex items-center justify-between w-full text-lg font-semibold mb-4 text-gray-800 hover:text-blue-600 transition-colors"
                onClick={() => toggleSection('travel')}
              >
                <div className="flex items-center">
                  <MapPin size={20} className="mr-2 text-blue-600" />
                  Travel Details
                </div>
                <ChevronsUpDown size={20} className={`transition-transform duration-200 ${expandedSection === 'travel' ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSection === 'travel' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">Purpose</p>
                      <p className="font-medium text-gray-800">{request.purpose}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">Duration</p>
                      <p className="font-medium text-gray-800">{travelDates.duration} days</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">From</p>
                      <p className="font-medium text-gray-800">
                        {travelDates.start.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-gray-500 text-sm mb-1">To</p>
                      <p className="font-medium text-gray-800">
                        {travelDates.end.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {request.previousOutstandingAdvance ? (
                      <div className="flex flex-col md:col-span-2">
                        <p className="text-gray-500 text-sm mb-1">Previous Outstanding Advance</p>
                        <p className="font-medium text-red-600">${request.previousOutstandingAdvance}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <button 
                className="flex items-center justify-between w-full text-lg font-semibold mb-4 text-gray-800 hover:text-blue-600 transition-colors"
                onClick={() => toggleSection('expense')}
              >
                <div className="flex items-center">
                  <DollarSign size={20} className="mr-2 text-blue-600" />
                  Expense Details
                </div>
                <ChevronsUpDown size={20} className={`transition-transform duration-200 ${expandedSection === 'expense' ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSection === 'expense' ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {expenseItems.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No expense items found.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-sm">
                            <th className="p-3 text-left font-semibold border-b">Category</th>
                            <th className="p-3 text-left font-semibold border-b">Description</th>
                            <th className="p-3 text-left font-semibold border-b">Amount</th>
                            <th className="p-3 text-left font-semibold border-b">Receipts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseItems.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="p-3 font-medium text-gray-800">
                                {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                              </td>
                              <td className="p-3 text-gray-600">{item.description || '-'}</td>
                              <td className="p-3 font-medium text-gray-800">
                                ${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td className="p-3">
                                {receipts[item.id] && receipts[item.id].length > 0 ? (
                                  <div className="flex flex-col space-y-1">
                                    {receipts[item.id].map((receipt) => (
                                      <a
                                        key={receipt.id}
                                        href={`/uploads/${receipt.storedFilename}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm group"
                                      >
                                        <Paperclip size={14} className="mr-1" />
                                        <span className="truncate max-w-[150px]">{receipt.originalFilename}</span>
                                        <Eye size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-sm">No receipts</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-gray-50">
                            <td colSpan={2} className="p-3 border-t-2 border-gray-300 text-right">Total</td>
                            <td className="p-3 border-t-2 border-gray-300 text-blue-600">
                              ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                            <td className="p-3 border-t-2 border-gray-300"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {request.status === 'pending' && (
              <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                  <MessageCircle size={20} className="mr-2 text-blue-600" />
                  Approval Action
                </h2>
                
                <div className="mb-4">
                  <label htmlFor="approvalComment" className="block mb-2 font-medium text-gray-700">Comments (Optional)</label>
                  <div className="relative">
                    <textarea
                      id="approvalComment"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                      placeholder="Add any comments or notes regarding your decision..."
                    />
                    <div className="absolute bottom-3 right-3 text-gray-400 text-sm">
                      {approvalComment.length} characters
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => router.push('/approver/dashboard')}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => handleApproveReject('rejected')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ThumbsDown size={18} className="mr-2" />
                        Reject Request
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApproveReject('approved')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ThumbsUp size={18} className="mr-2" />
                        Approve Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Briefcase size={18} className="mr-2 text-blue-600" />
                  Request Summary
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-bold text-blue-600">
                      ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">Submitted On</span>
                    <span className="text-gray-800">
                      {new Date(request.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">Travel Duration</span>
                    <span className="text-gray-800">{travelDates.duration} days</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">Expense Items</span>
                    <span className="text-gray-800">{expenseItems.length}</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <FileText size={18} className="mr-2 text-blue-600" />
                  Approval Guidelines
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-3 text-gray-700 text-sm">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <span>Verify that all expense items align with the company travel policy.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <span>Check that appropriate receipts are attached for all relevant expenses.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <span>Confirm that the travel dates and purpose are valid for the employee's role.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-xs font-bold text-blue-600">4</span>
                    </div>
                    <span>Review any previous outstanding advances before approving new requests.</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Download size={18} className="mr-2 text-blue-600" />
                  Actions
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="#" 
                      className="flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download size={18} className="mr-2" />
                      <span>Download Request as PDF</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} className="mr-2" />
                      <span>View All Attachments</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Users size={18} className="mr-2" />
                      <span>View Employee History</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}