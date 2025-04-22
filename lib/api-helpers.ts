// lib/api-helpers.ts
// Utility functions for API error handling and debugging

/**
 * Format an error for API responses
 * @param error The error object
 * @param defaultMessage Default message if error doesn't have one
 * @returns Formatted error object
 */
export function formatApiError(error: any, defaultMessage: string = 'An unexpected error occurred') {
    console.error('API Error:', error);
    
    const errorResponse: Record<string, any> = {
      error: defaultMessage,
    };
    
    // Include message if available
    if (error instanceof Error) {
      errorResponse.message = error.message;
    } else if (typeof error === 'string') {
      errorResponse.message = error;
    }
    
    // Include additional details for development
    if (process.env.NODE_ENV === 'development') {
      // Include stack trace in development
      if (error instanceof Error) {
        errorResponse.stack = error.stack;
      }
      
      // Add Supabase error details if available
      if (error && typeof error === 'object') {
        if ('code' in error) errorResponse.code = error.code;
        if ('details' in error) errorResponse.details = error.details;
        if ('hint' in error) errorResponse.hint = error.hint;
        
        // For Supabase errors with additional context
        if ('message' in error && !errorResponse.message) {
          errorResponse.message = error.message;
        }
      }
    } else {
      // In production, provide less detailed but still helpful error info
      if (error && typeof error === 'object' && 'message' in error && !errorResponse.message) {
        errorResponse.message = error.message;
      }
    }
    
    return errorResponse;
  }
  
  /**
   * Validate common user fields
   * @param userData User data object
   * @returns Array of validation errors, empty if valid
   */
  export function validateUserData(userData: any) {
    const errors: string[] = [];
    
    // Check required fields
    if (!userData.email) errors.push('Email is required');
    if (!userData.name) errors.push('Name is required');
    if (!userData.role) errors.push('Role is required');
    
    // Basic email validation
    if (userData.email && !/\S+@\S+\.\S+/.test(userData.email)) {
      errors.push('Invalid email format');
    }
    
    // Role validation
    const validRoles = ['admin', 'approver', 'checker', 'employee'];
    if (userData.role && !validRoles.includes(userData.role)) {
      errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    return errors;
  }
  
  /**
   * Log detailed request information for debugging
   * @param request The NextRequest object
   * @param context Additional context information
   */
  export function logRequestDetails(request: Request, context: Record<string, any> = {}) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const details = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      ...context
    };
    
    console.log('=== API Request Details ===');
    console.log(JSON.stringify(details, null, 2));
    console.log('==========================');
  }