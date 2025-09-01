// lib/api-client-with-toast.ts
// Enhanced API client with toast integration and error handling

import { toast } from 'sonner';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

class ApiClientWithToast {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return url;
  }

  private async handleResponse<T>(response: Response, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { 
      showSuccessToast = false, 
      showErrorToast = true, 
      successMessage, 
      errorMessage 
    } = options;

    try {
      const data = await response.json();
      
      if (!response.ok) {
        const error = data.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (showErrorToast) {
          toast.error(errorMessage || error);
        }
        
        return {
          success: false,
          error,
          data: undefined
        };
      }

      // Handle new API response format
      if (data.success !== undefined) {
        if (data.success && showSuccessToast) {
          toast.success(successMessage || data.message || 'Operation completed successfully');
        }
        return data;
      }

      // Handle legacy format
      if (showSuccessToast) {
        toast.success(successMessage || data.message || 'Operation completed successfully');
      }
      
      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to parse response';
      
      if (showErrorToast) {
        toast.error(errorMessage || errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
        data: undefined
      };
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, showSuccessToast, showErrorToast, successMessage, errorMessage, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      return this.handleResponse<T>(response, { showSuccessToast, showErrorToast, successMessage, errorMessage });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      
      if (options.showErrorToast !== false) {
        toast.error(options.errorMessage || errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
        data: undefined
      };
    }
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, showSuccessToast, showErrorToast, successMessage, errorMessage, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...fetchOptions,
      });

      return this.handleResponse<T>(response, { showSuccessToast, showErrorToast, successMessage, errorMessage });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      
      if (options.showErrorToast !== false) {
        toast.error(options.errorMessage || errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
        data: undefined
      };
    }
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, showSuccessToast, showErrorToast, successMessage, errorMessage, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...fetchOptions,
      });

      return this.handleResponse<T>(response, { showSuccessToast, showErrorToast, successMessage, errorMessage });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      
      if (options.showErrorToast !== false) {
        toast.error(options.errorMessage || errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
        data: undefined
      };
    }
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, showSuccessToast, showErrorToast, successMessage, errorMessage, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      return this.handleResponse<T>(response, { showSuccessToast, showErrorToast, successMessage, errorMessage });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      
      if (options.showErrorToast !== false) {
        toast.error(options.errorMessage || errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
        data: undefined
      };
    }
  }

  async patch<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, showSuccessToast, showErrorToast, successMessage, errorMessage, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...fetchOptions,
      });

      return this.handleResponse<T>(response, { showSuccessToast, showErrorToast, successMessage, errorMessage });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      
      if (options.showErrorToast !== false) {
        toast.error(options.errorMessage || errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
        data: undefined
      };
    }
  }
}

// Create singleton instance
const apiClientWithToast = new ApiClientWithToast();

// Export both the class and instance
export { ApiClientWithToast };
export default apiClientWithToast;

// Enhanced convenience methods with toast integration
export const apiWithToast = {
  // Tasks
  tasks: {
    getAll: (params?: { department?: string; status?: string; myTasks?: boolean }) =>
      apiClientWithToast.get('/tasks', { 
        params: { ...params, includeActionItems: 'true' },
        errorMessage: 'Failed to load tasks'
      }),
    create: (data: any) => 
      apiClientWithToast.post('/tasks', data, { 
        showSuccessToast: true,
        successMessage: 'Task created successfully',
        errorMessage: 'Failed to create task'
      }),
    update: (id: string, data: any) => 
      apiClientWithToast.put(`/tasks/${id}`, data, {
        showSuccessToast: true,
        successMessage: 'Task updated successfully',
        errorMessage: 'Failed to update task'
      }),
    delete: (id: string) => 
      apiClientWithToast.delete(`/tasks/${id}`, {
        showSuccessToast: true,
        successMessage: 'Task deleted successfully',
        errorMessage: 'Failed to delete task'
      })
  },

  // Meetings
  meetings: {
    getAll: (params?: { myMeetings?: boolean; includeActionItems?: boolean }) =>
      apiClientWithToast.get('/meetings', { 
        params,
        errorMessage: 'Failed to load meetings'
      }),
    create: (data: any) => 
      apiClientWithToast.post('/meetings', data, {
        showSuccessToast: true,
        successMessage: 'Meeting created successfully',
        errorMessage: 'Failed to create meeting'
      }),
    update: (id: string, data: any) => 
      apiClientWithToast.put(`/meetings/${id}`, data, {
        showSuccessToast: true,
        successMessage: 'Meeting updated successfully',
        errorMessage: 'Failed to update meeting'
      })
  },

  // Travel Requests
  requests: {
    getAll: (params?: { myRequests?: boolean; status?: string }) =>
      apiClientWithToast.get('/requests', { 
        params,
        errorMessage: 'Failed to load requests'
      }),
    create: (data: any) => 
      apiClientWithToast.post('/requests', data, {
        showSuccessToast: true,
        successMessage: 'Request submitted successfully',
        errorMessage: 'Failed to submit request'
      }),
    update: (id: string, data: any) => 
      apiClientWithToast.put(`/requests/${id}`, data, {
        showSuccessToast: true,
        successMessage: 'Request updated successfully',
        errorMessage: 'Failed to update request'
      })
  },

  // Leave Requests
  leaveRequests: {
    getAll: (params?: { myRequests?: boolean; status?: string }) =>
      apiClientWithToast.get('/leave-requests', { 
        params,
        errorMessage: 'Failed to load leave requests'
      }),
    create: (data: any) => 
      apiClientWithToast.post('/leave-requests', data, {
        showSuccessToast: true,
        successMessage: 'Leave request submitted successfully',
        errorMessage: 'Failed to submit leave request'
      }),
    update: (id: string, status: string, approverComments?: string) =>
      apiClientWithToast.put('/leave-requests', { id, status, approverComments }, {
        showSuccessToast: true,
        successMessage: `Leave request ${status} successfully`,
        errorMessage: 'Failed to update leave request'
      })
  },

  // Time Logs
  timeLogs: {
    getAll: (params?: { userId?: string; date?: string; personal?: boolean }) =>
      apiClientWithToast.get('/time-logs', { 
        params,
        errorMessage: 'Failed to load time logs'
      }),
    create: (data: any) => 
      apiClientWithToast.post('/time-logs', data, {
        showSuccessToast: true,
        successMessage: 'Time log recorded successfully',
        errorMessage: 'Failed to record time log'
      }),
    update: (id: string, data: any) => 
      apiClientWithToast.put('/time-logs', { id, ...data }, {
        showSuccessToast: true,
        successMessage: 'Time log updated successfully',
        errorMessage: 'Failed to update time log'
      })
  },

  // Notifications
  notifications: {
    getAll: (params?: { unreadOnly?: boolean; page?: number }) =>
      apiClientWithToast.get('/notifications', { 
        params,
        errorMessage: 'Failed to load notifications'
      }),
    markAsRead: (notificationIds: string[]) =>
      apiClientWithToast.put('/notifications', { notificationIds, markAsRead: true }, {
        showSuccessToast: true,
        successMessage: 'Notifications marked as read',
        errorMessage: 'Failed to mark notifications as read'
      }),
    markAsUnread: (notificationIds: string[]) =>
      apiClientWithToast.put('/notifications', { notificationIds, markAsRead: false }, {
        showSuccessToast: true,
        successMessage: 'Notifications marked as unread',
        errorMessage: 'Failed to mark notifications as unread'
      })
  },

  // Follow-ups
  followUps: {
    getForUser: (userId?: string) =>
      apiClientWithToast.get('/follow-ups/user', { 
        params: { userId },
        errorMessage: 'Failed to load follow-ups'
      }),
    update: (itemId: string, isDone: boolean) =>
      apiClientWithToast.patch('/follow-ups/user', { is_done: isDone }, { 
        params: { itemId },
        showSuccessToast: true,
        successMessage: `Follow-up marked as ${isDone ? 'completed' : 'pending'}`,
        errorMessage: 'Failed to update follow-up'
      })
  },

  // Dashboard
  dashboard: {
    employee: (params?: { employeeId?: string; period?: string }) =>
      apiClientWithToast.get('/dashboard/employee', { 
        params,
        errorMessage: 'Failed to load dashboard data'
      }),
    hr: (params?: { period?: string; includeInactive?: boolean }) =>
      apiClientWithToast.get('/hr/dashboard', { 
        params,
        errorMessage: 'Failed to load HR dashboard data'
      })
  }
};

export type { ApiResponse };