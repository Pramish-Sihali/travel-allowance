// components/dashboard/data/requestTypeMappings.ts
import { CreditCard, AlertTriangle, MapPin, Plane } from 'lucide-react';

// Get label for request type
export const getRequestTypeLabel = (type: string | undefined): string => {
  switch (type) {
    case 'in-valley':
      return 'In-Valley';
    case 'normal':
      return 'Travel';
    case 'advance':
      return 'Advance';
    case 'emergency':
      return 'Emergency';
    default:
      return 'Travel';
  }
};

// Get badge class for request type
export const getRequestTypeBadgeClass = (type: string | undefined): string => {
  switch (type) {
    case 'normal':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'advance':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in-valley':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'emergency':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

// Get icon component for request type
export const getTypeIcon = (type: string | undefined) => {
  switch (type) {
    case 'in-valley':
      return MapPin;
    case 'advance':
      return CreditCard;
    case 'emergency':
      return AlertTriangle;
    case 'normal':
    default:
      return Plane;
  }
};

// Type filter options
export const requestTypeFilterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'normal', label: 'Travel' },
  { value: 'in-valley', label: 'In-Valley' },
  { value: 'advance', label: 'Advance' },
  { value: 'emergency', label: 'Emergency' }
];

// Get request detail route based on type
export const getRequestDetailRoute = (role: 'employee' | 'approver' | 'checker', requestType: string | undefined, id: string): string => {
  const baseRoute = `/${role}/request-detail`;
  
  if (requestType === 'in-valley') {
    return `${baseRoute}/in-valley/${id}`;
  }
  
  return `${baseRoute}/${id}`;
};

// For employee dashboard
export const getEmployeeRequestRoute = (requestType: string | undefined, id: string): string => {
  if (requestType === 'in-valley') {
    return `/employee/requests/in-valley/${id}`;
  }
  return `/employee/requests/${id}`;
};