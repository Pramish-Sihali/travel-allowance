'use client';

import { useState, useEffect } from 'react';
import { Notification } from '@/types';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationsPanelProps {
  userId: string;
}

export default function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Setup polling for new notifications (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, [userId]);
  
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notification => !notification.isRead);
    
    if (unreadNotifications.length === 0) return;
    
    try {
      // In a real application, you might want to batch this request
      for (const notification of unreadNotifications) {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PATCH',
        });
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const getNotificationIcon = (notification: Notification) => {
    // In a real application, you might want to determine the icon based on notification type
    if (notification.message.toLowerCase().includes('approved')) {
      return <CheckCircle size={18} className="text-green-500" />;
    } else if (notification.message.toLowerCase().includes('rejected')) {
      return <X size={18} className="text-red-500" />;
    } else if (notification.message.toLowerCase().includes('reminder')) {
      return <AlertTriangle size={18} className="text-yellow-500" />;
    } else {
      return <Info size={18} className="text-blue-500" />;
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 border-b flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <Bell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
          <h2 className="font-semibold text-lg">Notifications</h2>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <>
              <span className="px-2 py-1 bg-white text-blue-600 text-xs font-bold rounded-full">
                {unreadCount}
              </span>
              <button 
                onClick={markAllAsRead}
                className="text-xs bg-blue-400 hover:bg-blue-300 text-white px-2 py-1 rounded transition-colors duration-200"
                title="Mark all as read"
              >
                <Check size={16} />
              </button>
            </>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs bg-blue-400 hover:bg-blue-300 text-white px-2 py-1 rounded transition-colors duration-200"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      
      <div className={`divide-y ${isExpanded ? 'max-h-96' : 'max-h-64'} overflow-y-auto transition-all duration-300`}>
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
            <Bell size={24} className="text-gray-400" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${!notification.isRead ? 'border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors duration-200 flex items-center"
                        title="Mark as read"
                      >
                        <Check size={12} className="mr-1" />
                        <span>Read</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50 border-t text-center">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-500 hover:text-blue-700 transition-colors duration-200"
          >
            {isExpanded ? "Show less" : "Show all notifications"}
          </button>
        </div>
      )}
    </div>
  );
}