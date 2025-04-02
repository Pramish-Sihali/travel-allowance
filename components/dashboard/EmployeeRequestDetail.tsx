'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest, ExpenseItem, Receipt } from '@/types';
import { 
  ArrowLeft, Calendar, DollarSign, FileText, Paperclip, 
  Clock, ExternalLink, AlertTriangle, CheckCircle, 
  Info, Download, MapPin, User, Briefcase, 
  Inbox, Eye, ChevronsUpDown
} from 'lucide-react';

interface EmployeeRequestDetailProps {
  requestId: string;
}

export default function EmployeeRequestDetail({ requestId }: EmployeeRequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
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
  
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const getStatusIcon = () => {
    if (!request) return null;
    
    switch (request.status) {
      case 'pending':
        return <Clock size={24} className="text-yellow-500" />;
      case 'approved':
        return <CheckCircle size={24} className="text-green-500" />;
      case 'rejected':
        return <AlertTriangle size={24} className="text-red-500" />;
      default:
        return <Info size={24} className="text-blue-500" />;
    }
  };
  
  const getStatusBadgeClass = () => {
    if (!request) return '';
    
    switch (request.status) {
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
            onClick={() => router.push('/employee/dashboard')}
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push('/employee/dashboard')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass()}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h1 className="text-2xl font-bold mb-2">Travel Request Details</h1>
          <p className="opacity-90">{request.purpose}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white">
          <div className="col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <Calendar size={20} className="mr-2 text-blue-600" />
                Travel Information
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
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
                  
                  <div>
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
                  
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Duration</p>
                    <p className="font-medium text-gray-800">{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Submitted On</p>
                    <p className="font-medium text-gray-800">
                      {new Date(request.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <button 
                className="flex items-center justify-between w-full text-lg font-semibold mb-4 text-gray-800 hover:text-blue-600 transition-colors"
                onClick={() => toggleSection('expenses')}
              >
                <div className="flex items-center">
                  <DollarSign size={20} className="mr-2 text-blue-600" />
                  Expense Details
                </div>
                <ChevronsUpDown size={20} className={`transition-transform duration-200 ${expandedSection === 'expenses' ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSection === 'expenses' ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {expenseItems.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <Inbox size={32} className="mx-auto text-gray-400 mb-2" />
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
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm"
                                      >
                                        <Paperclip size={14} className="mr-1" />
                                        <span className="truncate max-w-[150px]">{receipt.originalFilename}</span>
                                        <Download size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            
            {request.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertTriangle size={24} className="text-red-500 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Request Rejected</h3>
                  <p className="text-red-700">
                    Your travel request has been rejected. Please contact your supervisor for more information.
                  </p>
                  <a href="#" className="inline-flex items-center mt-3 text-red-600 hover:text-red-800 transition-colors text-sm font-medium">
                    <ExternalLink size={16} className="mr-1" />
                    Contact Supervisor
                  </a>
                </div>
              </div>
            )}
            
            {request.status === 'approved' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <CheckCircle size={24} className="text-green-500 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Request Approved</h3>
                  <p className="text-green-700">
                    Your travel request has been approved. Please collect your advance from the Finance department.
                  </p>
                  <p className="mt-2 text-green-700">
                    Remember to submit all receipts within 3 days of returning from your travel.
                  </p>
                  <div className="flex items-center mt-3 space-x-3">
                    <a href="#" className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors text-sm font-medium">
                      <Download size={16} className="mr-1" />
                      Download Approval
                    </a>
                    <a href="#" className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors text-sm font-medium">
                      <ExternalLink size={16} className="mr-1" />
                      Contact Finance
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {request.status === 'pending' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <Clock size={24} className="text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Request Pending</h3>
                  <p className="text-yellow-700">
                    Your travel request is pending approval. You will be notified when it is reviewed.
                  </p>
                  <div className="mt-3 bg-white rounded p-3 border border-yellow-100">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-yellow-400 rounded-full mr-2"></div>
                      <p className="text-sm text-yellow-700">Submitted for review</p>
                    </div>
                    <div className="w-0.5 h-4 bg-gray-200 ml-1 my-1"></div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-gray-300 rounded-full mr-2"></div>
                      <p className="text-sm text-gray-500">Manager approval</p>
                    </div>
                    <div className="w-0.5 h-4 bg-gray-200 ml-1 my-1"></div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-gray-300 rounded-full mr-2"></div>
                      <p className="text-sm text-gray-500">Finance verification</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="col-span-1">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Info size={18} className="mr-2 text-blue-600" />
                Request Summary
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-sm">Request ID</p>
                  <p className="font-mono text-gray-800">{request.id.substring(0, 8)}...</p>
                </div>
                
                <div>
                  <p className="text-gray-500 text-sm">Total Amount</p>
                  <p className="font-bold text-blue-600">
                    ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-500 text-sm">Duration</p>
                  <p className="text-gray-800">{travelDates.duration} day{travelDates.duration !== 1 ? 's' : ''}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 text-sm">Status</p>
                  <p className="text-gray-800 capitalize">{request.status}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 text-sm">Expense Items</p>
                  <p className="text-gray-800">{expenseItems.length}</p>
                </div>
                
                {request.previousOutstandingAdvance ? (
                  <div>
                    <p className="text-gray-500 text-sm">Previous Outstanding Advance</p>
                    <p className="text-gray-800">${request.previousOutstandingAdvance}</p>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-3">
                <a href="#" className="flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download size={18} className="mr-2" />
                  <span>Download as PDF</span>
                </a>
                <a href="#" className="flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye size={18} className="mr-2" />
                  <span>View Attachments</span>
                </a>
                <a href="#" className="flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <MapPin size={18} className="mr-2" />
                  <span>View Itinerary</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}