'use client';

import { useState, useEffect } from 'react';
import { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Info, AlertTriangle, CheckCircle, RefreshCw, UserCheck, Calendar } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface NotificationsPanelProps {
  userId: string;
  notifications?: Notification[]; // Allow notifications to be passed as prop
}

export default function NotificationsPanel({ userId, notifications: propNotifications }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(propNotifications || []);
  const [loading, setLoading] = useState(!propNotifications);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // If notifications are passed as props, use them directly
    if (propNotifications) {
      setNotifications(propNotifications);
      setLoading(false);
    } else {
      // Fall back to individual API call only if no notifications provided
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
    }
  }, [userId, propNotifications]);
  
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
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notification => !notification.read);
    
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
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const getNotificationIcon = (notification: Notification) => {
    const message = notification.message.toLowerCase();
    
    // Leave request related notifications
    if (message.includes('leave request') && message.includes('approved')) {
      return <UserCheck size={18} className="text-green-600" />;
    } else if (message.includes('leave request') && message.includes('rejected')) {
      return <X size={18} className="text-red-600" />;
    } else if (message.includes('leave request') && (message.includes('submitted') || message.includes('requires'))) {
      return <Calendar size={18} className="text-orange-500" />;
    }
    
    // Travel request related notifications
    else if (message.includes('approved')) {
      return <CheckCircle size={18} className="text-green-500" />;
    } else if (message.includes('rejected')) {
      return <X size={18} className="text-red-500" />;
    } else if (message.includes('reminder')) {
      return <AlertTriangle size={18} className="text-amber-500" />;
    } else if (message.includes('urgent') || message.includes('emergency')) {
      return <AlertTriangle size={18} className="text-red-500" />;
    } else {
      return <Info size={18} className="text-blue-500" />;
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} />
              <span>Notifications</span>
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-l-4 border-l-blue-500 shadow-md">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Bell size={18} className={`text-blue-600 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Notifications</CardTitle>
              {unreadCount > 0 && (
                <p className="text-sm text-blue-600">{unreadCount} unread notifications</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <>
                <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                  {unreadCount}
                </Badge>
                <Button 
                  size="icon"
                  variant="outline"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="h-8 w-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Check size={14} />
                </Button>
              </>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-200">
                All read
              </Badge>
            )}
            <Button 
              size="icon"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Show less" : "Show more"}
              className="h-8 w-8 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {isExpanded ? (
                <RefreshCw size={14} className="rotate-180 transition-transform" />
              ) : (
                <RefreshCw size={14} className="transition-transform" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {notifications.length === 0 ? (
        <CardContent className="p-6 text-center flex flex-col items-center justify-center">
          <Bell size={24} className="text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No notifications yet</p>
        </CardContent>
      ) : (
        <>
          <CardContent className="p-0">
            <ScrollArea className={isExpanded ? "h-96" : "h-64"}>
              <div className="divide-y">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 ${
                      !notification.read 
                        ? 'bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1 p-1 rounded-full bg-white shadow-sm">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className={`text-sm leading-relaxed ${
                            !notification.read 
                              ? 'font-medium text-gray-900' 
                              : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                              className="h-7 w-7 rounded-full hover:bg-blue-100 text-blue-600 ml-2"
                            >
                              <Check size={12} />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-3 justify-center bg-gradient-to-r from-gray-50 to-white border-t">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
            >
              {isExpanded ? "Show fewer notifications" : "Show all notifications"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}