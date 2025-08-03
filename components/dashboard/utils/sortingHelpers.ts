// components/dashboard/utils/sortingHelpers.ts
import { TravelRequest } from '@/types';
import { ArrowUpDown } from 'lucide-react';

// Sort configuration type
export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

/**
 * Sort requests based on sort configuration
 */
export const sortRequests = (
  requests: TravelRequest[],
  sortConfig: SortConfig | null
): TravelRequest[] => {
  if (sortConfig === null) return [...requests];
  
  return [...requests].sort((a, b) => {
    const aValue = getValueByKey(a, sortConfig.key);
    const bValue = getValueByKey(b, sortConfig.key);
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Get value from request object by key for sorting
 */
const getValueByKey = (obj: any, key: string): any => {
  // Handle date fields
  if (
    key === 'travelDateFrom' || 
    key === 'travelDateTo' || 
    key === 'createdAt' || 
    key === 'updatedAt' || 
    key === 'expenseDate'
  ) {
    return new Date(obj[key] || 0).getTime();
  }
  
  // Handle numeric fields
  if (key === 'totalAmount') {
    return Number(obj[key] || 0);
  }
  
  // Handle string fields
  return (obj[key] || '').toString();
};

/**
 * Toggle sort direction or set initial sort
 */
export const toggleSort = (
  currentSortConfig: SortConfig | null,
  key: string
): SortConfig => {
  let direction: 'ascending' | 'descending' = 'ascending';
  
  if (currentSortConfig?.key === key && currentSortConfig.direction === 'ascending') {
    direction = 'descending';
  }
  
  return { key, direction };
};

/**
 * Get sort indicator icon for table headers
 */
export const getSortIndicator = (
  key: string,
  sortConfig: SortConfig | null
) => {
  if (sortConfig?.key !== key) {
    return <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />;
  }
  
  if (sortConfig.direction === 'ascending') {
    return <ArrowUpDown size={14} className="ml-1 text-primary rotate-0" />;
  }
  
  return <ArrowUpDown size={14} className="ml-1 text-primary rotate-180" />;
};