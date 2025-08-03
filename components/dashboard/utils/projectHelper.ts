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
  
