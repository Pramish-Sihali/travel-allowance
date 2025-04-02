'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import  NotificationsPanel  from './NotificationsPanel';
import { PlusCircle, Calendar, DollarSign, Clock, FileText, ExternalLink, BookOpen, Mail, HelpCircle, AlertTriangle } from 'lucide-react';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  
  // Hardcoded employee ID (would come from auth in a real app)
  const employeeId = '123';
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`/api/requests?employeeId=${employeeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        
        const data = await response.json();
        setRequests(data);
        
        // Calculate statistics
        const pendingCount = data.filter((req: TravelRequest) => req.status === 'pending').length;
        const approvedCount = data.filter((req: TravelRequest) => req.status === 'approved').length;
        const rejectedCount = data.filter((req: TravelRequest) => req.status === 'rejected').length;
        const totalAmount = data.reduce((sum: number, req: TravelRequest) => sum + req.totalAmount, 0);
        
        setStats({
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          totalAmount: totalAmount
        });
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [employeeId]);
  
  const handleNewRequest = () => {
    router.push('/employee/requests/new');
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">My Travel Requests</h1>
            <button
              onClick={handleNewRequest}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle size={18} className="mr-2" />
              New Request
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 mr-4">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending</p>
                  <p className="text-xl font-bold text-gray-800">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <FileText size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Approved</p>
                  <p className="text-xl font-bold text-gray-800">{stats.approved}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 mr-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Rejected</p>
                  <p className="text-xl font-bold text-gray-800">{stats.rejected}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <DollarSign size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                  <p className="text-xl font-bold text-gray-800">
                    ${stats.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 mb-4">You haven't submitted any travel requests yet.</p>
              </div>
              <button
                onClick={handleNewRequest}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                <PlusCircle size={18} className="inline mr-2" />
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="p-3 text-left font-semibold border-b">
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2 text-gray-500" />
                          Purpose
                        </div>
                      </th>
                      <th className="p-3 text-left font-semibold border-b">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-gray-500" />
                          Dates
                        </div>
                      </th>
                      <th className="p-3 text-left font-semibold border-b">
                        <div className="flex items-center">
                          <DollarSign size={16} className="mr-2 text-gray-500" />
                          Amount
                        </div>
                      </th>
                      <th className="p-3 text-left font-semibold border-b">
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-500" />
                          Status
                        </div>
                      </th>
                      <th className="p-3 text-left font-semibold border-b">Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr 
                        key={request.id} 
                        className="border-b hover:bg-blue-50 transition-colors cursor-pointer" 
                        onClick={() => router.push(`/employee/requests/${request.id}`)}
                      >
                        <td className="p-3">
                          <div className="max-w-xs truncate font-medium text-gray-800" title={request.purpose}>
                            {request.purpose.substring(0, 30)}
                            {request.purpose.length > 30 ? '...' : ''}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col text-sm">
                            <span className="text-gray-800 font-medium">
                              {new Date(request.travelDateFrom).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-gray-500">
                              to {new Date(request.travelDateTo).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-gray-800">
                          ${request.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-sm">
                          {new Date(request.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
              <BookOpen size={20} className="mr-2 text-blue-600" />
              Policy Summary
            </h2>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <ul className="space-y-3">
                {[
                  "Employees must submit all invoices and supporting documents within three days of returning from the field.",
                  'The maximum lodging allowance for each official trip will be determined by the Board and the Finance Department based on the nature of the travel.',
                  'Local travel and food allowances will be covered through per-diem (NPR 1,500), and no invoices are needed for these expenses.',
                  "Accommodation and other costs will be reimbursed based on actual expenses, with invoices in the company's name required.",
                  "Any additional expenses for which reimbursement is requested must be supported by invoices or bills."
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <NotificationsPanel userId={employeeId} />
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h2 className="font-semibold text-lg flex items-center">
                <ExternalLink size={18} className="mr-2" />
                Quick Links
              </h2>
            </div>
            <div className="p-4 divide-y">
              <a 
                href="#" 
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <BookOpen size={18} className="mr-3 text-blue-600" />
                <span>Travel Policy Documents</span>
              </a>
              <a 
                href="#" 
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FileText size={18} className="mr-3 text-blue-600" />
                <span>Expense Categories Guide</span>
              </a>
              <a 
                href="#" 
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Mail size={18} className="mr-3 text-blue-600" />
                <span>Contact Finance Department</span>
              </a>
              <a 
                href="#" 
                className="flex items-center py-3 px-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <HelpCircle size={18} className="mr-3 text-blue-600" />
                <span>Frequently Asked Questions</span>
              </a>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
            <p className="text-blue-700 text-sm mb-3">
              If you have any questions about your travel reimbursements or need assistance with your requests, contact the finance team.
            </p>
            <a 
              href="mailto:finance@company.com" 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Mail size={16} className="mr-1" />
              finance@company.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}