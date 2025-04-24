// utils/projectHelper.ts

/**
 * Fetch project details by ID
 * @param projectId - The ID of the project to fetch
 * @returns The project name or null if not found
 */
export const fetchProjectById = async (projectId: string): Promise<string | null> => {
    if (!projectId) return null;
    
    // Check if it's a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(projectId)) {
      // Not a UUID, likely already a name
      return projectId;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        if (projectData && projectData.name) {
          console.log(`Resolved project ID ${projectId} to name: ${projectData.name}`);
          return projectData.name;
        }
      }
      
      console.error('Failed to fetch project details:', response.statusText);
      return projectId; // Fallback to the ID if we can't resolve it
    } catch (error) {
      console.error('Error fetching project details:', error);
      return projectId; // Fallback to the ID if we can't resolve it
    }
  };
  
  /**
   * Format emergency reason into human-readable format
   * @param reason - The emergency reason code
   * @param reasonOther - The custom reason (for 'other' type)
   * @returns Formatted emergency reason
   */
  export const formatEmergencyReason = (reason: string, reasonOther?: string): string => {
    switch(reason) {
      case 'urgent-meeting': return 'Urgent Meeting';
      case 'crisis-response': return 'Crisis Response';
      case 'time-sensitive': return 'Time-Sensitive Opportunity';
      case 'medical': return 'Medical Emergency';
      case 'other': return reasonOther || 'Other';
      default: return reason;
    }
  };
  
  /**
   * Format request status into human-readable format
   * @param status - The request status code
   * @returns Formatted status
   */
  export const formatRequestStatus = (status: string): string => {
    switch (status) {
      case 'travel_approved':
        return 'Travel Approved';
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected_by_checker':
        return 'Rejected by Finance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  /**
   * Get CSS class for status badge
   * @param status - The request status
   * @returns CSS class string
   */
  export const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending':
      case 'travel_approved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_verification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'rejected_by_checker':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };