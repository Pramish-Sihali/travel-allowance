'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelRequest } from '@/types';
import { Calendar, Users, Search, Filter, Briefcase, ArrowUpDown, Clock, DollarSign, RefreshCw } from 'lucide-react';

export default function ApproverDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/requests');
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error refreshing requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply all filters and sorting
  let filteredRequests = [...requests];
  
  // Filter by status
  if (filter !== 'all') {
    filteredRequests = filteredRequests.filter(req => req.status === filter);
  }
  
  // Apply search filter
  if (searchTerm) {
    const lowerCaseSearch = searchTerm.toLowerCase();
    filteredRequests = filteredRequests.filter(req => 
      req.employeeName.toLowerCase().includes(lowerCaseSearch) ||
      req.department.toLowerCase().includes(lowerCaseSearch) ||
      req.purpose.toLowerCase().includes(lowerCaseSearch)
    );
  }
  
  // Apply sorting
  if (sortConfig !== null) {
    filteredRequests.sort((a, b) => {
      // @ts-ignore - dynamic property access
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      // @ts-ignore - dynamic property access
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }
  
  const handleViewDetails = (id: string) => {
    router.push(`/approver/requests/${id}`);
  };
  
  const getSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown size={14} className="ml-1 text-blue-500" />;
    }
    
    return <ArrowUpDown size={14} className="ml-1 text-blue-500 rotate-180" />;
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
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center">
            <Briefcase className="mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Travel Requests Dashboard</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <div className="flex items-center bg-gray-100 rounded-lg">
              <Filter className="ml-3 text-gray-500" size={18} />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="bg-transparent p-2 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending Requests</option>
                <option value="approved">Approved Requests</option>
                <option value="rejected">Rejected Requests</option>
                <option value="all">All Requests</option>
              </select>
            </div>
            
            <button 
              onClick={handleRefresh} 
              className="flex items-center bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              disabled={loading}
            >
              <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No travel requests found.</p>
            <p className="text-gray-400">Adjust your filters or check back later for new requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th 
                    className="p-3 text-left font-semibold border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('employeeName')}
                  >
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-gray-500" />
                      Employee
                      {getSortIndicator('employeeName')}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-left font-semibold border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('department')}
                  >
                    <div className="flex items-center">
                      Department
                      {getSortIndicator('department')}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-left font-semibold border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('travelDateFrom')}
                  >
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-500" />
                      Travel Dates
                      {getSortIndicator('travelDateFrom')}
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-b">Purpose</th>
                  <th 
                    className="p-3 text-left font-semibold border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('totalAmount')}
                  >
                    <div className="flex items-center">
                      <DollarSign size={16} className="mr-2 text-gray-500" />
                      Amount
                      {getSortIndicator('totalAmount')}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-left font-semibold border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-gray-500" />
                      Status
                      {getSortIndicator('status')}
                    </div>
                  </th>
                  <th className="p-3 text-center font-semibold border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-blue-50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-gray-800">{request.employeeName}</div>
                    </td>
                    <td className="p-3 text-gray-600">{request.department}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-gray-800">
                          {new Date(request.travelDateFrom).toLocaleDateString()}
                        </span>
                        <span className="text-gray-500 text-sm">
                          to {new Date(request.travelDateTo).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs truncate" title={request.purpose}>
                        {request.purpose.substring(0, 30)}
                        {request.purpose.length > 30 ? '...' : ''}
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
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleViewDetails(request.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
          <div>
            Total requests: {requests.length}
          </div>
          <div>
            Showing {filteredRequests.length} of {requests.length} requests
          </div>
        </div>
      </div>
    </div>
  );
}