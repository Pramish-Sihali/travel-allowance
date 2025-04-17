// components/dashboard/data/statusMappings.ts

// Define status badge classes for consistent styling
export const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'rejected_by_checker':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Format status text for display
  export const getFormattedStatus = (status: string): string => {
    switch (status) {
      case 'pending_verification':
        return 'Under Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Status options for filters
  export const statusFilterOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'pending_verification', label: 'Under Verification' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'rejected_by_checker', label: 'Rejected by Finance' }
  ];
  
  // Status filter options by role
  export const getStatusFilterOptionsByRole = (role: 'employee' | 'approver' | 'checker') => {
    switch (role) {
      case 'checker':
        return [
          { value: 'all', label: 'All Verified' },
          { value: 'approved', label: 'Approved Requests' },
          { value: 'rejected_by_checker', label: 'Rejected Requests' }
        ];
      case 'approver':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' }
        ];
      default:
        return statusFilterOptions;
    }
  };