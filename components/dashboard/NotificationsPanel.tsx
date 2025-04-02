'use client';

import { useState, useEffect } from 'react';
import { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Info, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
      return <AlertTriangle size={18} className="text-amber-500" />;
    } else {
      return <Info size={18} className="text-blue-500" />;
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
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
    <Card>
      <CardHeader className="pb-3 text-gray-900">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={18} className={unreadCount > 0 ? "animate-pulse" : ""} />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <>
                <Badge variant="secondary" className="bg-blue-600 text-primary">
                  {unreadCount}
                </Badge>
                <Button 
                  size="icon"
                  variant="secondary"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="h-7 w-7 bg-blabk/20 hover:bg-black/30 text-black"
                >
                  <Check size={14} />
                </Button>
              </>
            ) : null}
            <Button 
              size="icon"
              variant="secondary"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Show less" : "Show more"}
              className="h-7 w-7 bg-black/20 hover:bg-black/80 text-white"
            >
              {isExpanded ? (
                <RefreshCw size={14} />
              ) : (
                <RefreshCw size={14} />
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
                    className={`p-4 hover:bg-muted/50 transition-colors ${!notification.isRead ? 'border-l-4 border-primary' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`${!notification.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                              className="h-6 w-6 rounded-full"
                            >
                              <Check size={12} />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-2 justify-center bg-muted/30">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? "Show fewer" : "Show all notifications"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}