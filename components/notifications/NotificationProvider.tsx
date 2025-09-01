'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  userId: string;
  metadata?: {
    taskId?: string;
    projectId?: string;
    actionUrl?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'userId' | 'read'>) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => void;
  fetchNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userId = session?.user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const result = await response.json();
        
        // Handle the structured API response format
        if (result.success && result.data) {
          const notificationsData = result.data.notifications || [];
          if (Array.isArray(notificationsData)) {
            setNotifications(notificationsData);
          } else {
            console.warn('Notifications data is not an array:', notificationsData);
            setNotifications([]);
          }
        } else if (Array.isArray(result)) {
          // Handle legacy direct array response
          setNotifications(result);
        } else {
          console.warn('Notifications API returned unexpected format:', result);
          setNotifications([]);
        }
      } else {
        console.warn('Notifications API returned error status:', response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Reset to empty array on error
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      userId: userId || '',
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Simple console log instead of toast
    console.log(`📢 Notification: ${notificationData.title} - ${notificationData.message}`);
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
    isLoading
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper function to send notifications when assigning tasks
export function sendTaskAssignmentNotification(
  assignedUserIds: string[],
  taskTitle: string,
  taskId: string,
  assignedBy: string
) {
  // This would typically be called from the server side
  // For now, we'll create a client-side function that can be used in components
  return fetch('/api/notifications/task-assignment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignedUserIds,
      taskTitle,
      taskId,
      assignedBy
    })
  });
}