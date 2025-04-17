// components/dashboard/utils/requestHelpers.ts
import { TravelRequest } from '@/types';

/**
 * Get initials from a name for avatars
 */
export const getInitials = (name: string): string => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Filter requests based on search term, status and type
 */
export const filterRequests = (
  requests: TravelRequest[],
  searchTerm: string,
  statusFilter: string,
  typeFilter: string
): TravelRequest[] => {
  return requests
    .filter(request => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (request.employeeName?.toLowerCase()?.includes(searchLower) || false) ||
          (request.department?.toLowerCase()?.includes(searchLower) || false) ||
          (request.purpose?.toLowerCase()?.includes(searchLower) || false)
        );
      }
      return true;
    })
    .filter(request => {
      // Filter by status
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return request.status === 'pending' || request.status === 'pending_verification';
      if (statusFilter === 'approved') return request.status === 'approved';
      if (statusFilter === 'rejected') return request.status === 'rejected' || request.status === 'rejected_by_checker';
      return request.status === statusFilter;
    })
    .filter(request => {
      // Filter by request type
      if (typeFilter === 'all') return true;
      return request.requestType === typeFilter;
    });
};

/**
 * Split requests into current and past
 */
export const splitRequestsByDate = (requests: TravelRequest[]): {
  currentRequests: TravelRequest[];
  pastRequests: TravelRequest[];
} => {
  const currentDate = new Date();
  
  const currentRequests = requests.filter(
    req => req.status === 'pending' || 
           req.status === 'pending_verification' || 
           new Date(req.travelDateTo) >= currentDate
  );
  
  const pastRequests = requests.filter(
    req => (req.status === 'approved' || 
            req.status === 'rejected' || 
            req.status === 'rejected_by_checker') && 
           new Date(req.travelDateTo) < currentDate
  );
  
  return { currentRequests, pastRequests };
};

/**
 * Split requests into pending and completed
 */
export const splitRequestsByStatus = (requests: TravelRequest[]): {
  pendingRequests: TravelRequest[];
  completedRequests: TravelRequest[];
} => {
  const pendingRequests = requests.filter(
    req => req.status === 'pending'
  );
  
  const completedRequests = requests.filter(
    req => req.status !== 'pending'
  );
  
  return { pendingRequests, completedRequests };
};

/**
 * Split requests for checker dashboard
 */
export const splitRequestsForChecker = (requests: TravelRequest[]): {
  pendingVerificationRequests: TravelRequest[];
  verifiedRequests: TravelRequest[];
} => {
  const pendingVerificationRequests = requests.filter(
    req => req.status === 'pending_verification'
  );
  
  const verifiedRequests = requests.filter(
    req => req.status === 'approved' || req.status === 'rejected_by_checker'
  );
  
  return { pendingVerificationRequests, verifiedRequests };
};

/**
 * Get statistics from requests
 */
export const getRequestStatistics = (requests: TravelRequest[]) => {
  const pendingCount = requests.filter(req => 
    req.status === 'pending' || req.status === 'pending_verification'
  ).length;
  
  const approvedCount = requests.filter(req => 
    req.status === 'approved'
  ).length;
  
  const rejectedCount = requests.filter(req => 
    req.status === 'rejected' || req.status === 'rejected_by_checker'
  ).length;
  
  const totalAmount = requests.reduce((sum, req) => sum + (req.totalAmount || 0), 0);
  
  const travelCount = requests.filter(req => 
    req.requestType === 'normal' || !req.requestType
  ).length;
  
  const inValleyCount = requests.filter(req => 
    req.requestType === 'in-valley'
  ).length;
  
  const advanceCount = requests.filter(req => 
    req.requestType === 'advance'
  ).length;
  
  const emergencyCount = requests.filter(req => 
    req.requestType === 'emergency'
  ).length;
  
  const approvedAmount = requests
    .filter(req => req.status === 'approved')
    .reduce((sum, req) => sum + (req.totalAmount || 0), 0);
  
  return {
    pendingCount,
    approvedCount,
    rejectedCount,
    totalAmount,
    travelCount,
    inValleyCount,
    advanceCount,
    emergencyCount,
    approvedAmount
  };
};