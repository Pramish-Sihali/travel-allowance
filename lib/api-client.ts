// lib/api-client.ts
// Enhanced API client with consistent error handling and response formatting

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
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

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          data: undefined
        };
      }

      // Handle new API response format
      if (data.success !== undefined) {
        return data;
      }

      // Handle legacy format
      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
        data: undefined
      };
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
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

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
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

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
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

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
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

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }

  async patch<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
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

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined
      };
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export both the class and instance
export { ApiClient };
export default apiClient;

// Convenience methods for common operations
export const api = {
  // Tasks
  tasks: {
    getAll: (params?: { department?: string; status?: string; myTasks?: boolean }) =>
      apiClient.get('/tasks', { params: { ...params, includeActionItems: 'true' } }),
    create: (data: any) => apiClient.post('/tasks', data),
    update: (id: string, data: any) => apiClient.put(`/tasks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tasks/${id}`)
  },

  // Meetings
  meetings: {
    getAll: (params?: { myMeetings?: boolean; includeActionItems?: boolean }) =>
      apiClient.get('/meetings', { params }),
    create: (data: any) => apiClient.post('/meetings', data),
    update: (id: string, data: any) => apiClient.put(`/meetings/${id}`, data)
  },

  // Travel Requests
  requests: {
    getAll: (params?: { myRequests?: boolean; status?: string }) =>
      apiClient.get('/requests', { params }),
    create: (data: any) => apiClient.post('/requests', data),
    update: (id: string, data: any) => apiClient.put(`/requests/${id}`, data)
  },

  // Departments
  departments: {
    getAll: (includeStats?: boolean) =>
      apiClient.get('/departments', { params: { includeStats } }),
    create: (data: any) => apiClient.post('/departments', data),
    update: (id: string, data: any) => apiClient.put('/departments', { id, ...data })
  },

  // Projects
  projects: {
    getAll: (includeStats?: boolean) =>
      apiClient.get('/projects', { params: { includeStats } }),
    create: (data: any) => apiClient.post('/projects', data),
    update: (id: string, data: any) => apiClient.put('/projects', { id, ...data })
  },

  // Notifications
  notifications: {
    getAll: (params?: { unreadOnly?: boolean; page?: number }) =>
      apiClient.get('/notifications', { params }),
    markAsRead: (notificationIds: string[]) =>
      apiClient.put('/notifications', { notificationIds, markAsRead: true }),
    markAsUnread: (notificationIds: string[]) =>
      apiClient.put('/notifications', { notificationIds, markAsRead: false })
  },

  // Follow-ups
  followUps: {
    getForUser: (userId?: string) =>
      apiClient.get('/follow-ups/user', { params: { userId } }),
    update: (itemId: string, isDone: boolean) =>
      apiClient.patch('/follow-ups/user', { is_done: isDone }, { params: { itemId } })
  },

  // Leave Requests
  leaveRequests: {
    getAll: (params?: { myRequests?: boolean; status?: string }) =>
      apiClient.get('/leave-requests', { params }),
    create: (data: any) => apiClient.post('/leave-requests', data),
    update: (id: string, status: string, approverComments?: string) =>
      apiClient.put('/leave-requests', { id, status, approverComments })
  },

  // Time Logs
  timeLogs: {
    getAll: (params?: { userId?: string; date?: string; personal?: boolean }) =>
      apiClient.get('/time-logs', { params }),
    create: (data: any) => apiClient.post('/time-logs', data),
    update: (id: string, data: any) => apiClient.put('/time-logs', { id, ...data })
  },

  // Dashboard
  dashboard: {
    employee: (params?: { employeeId?: string; period?: string }) =>
      apiClient.get('/dashboard/employee', { params }),
    hr: (params?: { period?: string; includeInactive?: boolean }) =>
      apiClient.get('/hr/dashboard', { params })
  }
};

export type { ApiResponse };