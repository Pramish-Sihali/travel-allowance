'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCircle, LogOut, Bell, X } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type?: string;
}

interface HeaderProps {
  variant?: 'employee' | 'approver' | 'checker' | 'admin';
}

export default function Header({ variant = 'employee' }: HeaderProps) {
  const { data: session, status } = useSession();
  const { isCollapsed } = useSidebar();
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Define variant-specific properties with new brand colors
  const variantStyles = {
    employee: {
      gradientFrom: 'from-[#062121]',
      gradientTo: 'to-[#0a2d2d]',
      buttonBg: 'bg-[#d38d38]',
      buttonHover: 'hover:bg-[#b8762f]',
    },
    approver: {
      gradientFrom: 'from-[#062121]',
      gradientTo: 'to-[#0a2d2d]',
      buttonBg: 'bg-[#d38d38]',
      buttonHover: 'hover:bg-[#b8762f]',
    },
    checker: {
      gradientFrom: 'from-[#062121]',
      gradientTo: 'to-[#0a2d2d]',
      buttonBg: 'bg-[#d38d38]',
      buttonHover: 'hover:bg-[#b8762f]',
    },
    admin: {
      gradientFrom: 'from-[#062121]',
      gradientTo: 'to-[#0a2d2d]',
      buttonBg: 'bg-[#d38d38]',
      buttonHover: 'hover:bg-[#b8762f]',
    },
  };

  const styles = variantStyles[variant];

  useEffect(() => {
    // Check if user has a name, if not, show dialog after a short delay
    if (status === 'authenticated' && !session?.user?.name) {
      const timer = setTimeout(() => setIsNameDialogOpen(true), 500);
      return () => clearTimeout(timer);
    }
    
    // Fetch notifications only once when authenticated
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [session, status]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = () => {
    // Refresh notifications when bell is clicked
    fetchNotifications();
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const updateName = async () => {
    if (!name.trim()) return;
    
    setIsUpdating(true);
    try {
      // API call to update user name
      const response = await fetch('/api/user/update-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        // Force refresh session to get updated name
        window.location.reload();
      } else {
        console.error('Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsUpdating(false);
      setIsNameDialogOpen(false);
    }
  };

  return (
    <>
      <header className={`bg-gradient-to-r ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md`}>
        <div className="w-full px-4 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            {/* Left side - Logo and Welcome */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#d38d38] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-base">IX</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-bold tracking-tight font-lato">IXI Employee Portal</h1>
                </div>
              </div>
            </div>

            {/* Right side - User info, Notifications, and Logout */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* User Welcome Message */}
              <div className="hidden md:flex items-center space-x-2">
                <UserCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium font-nunito text-sm md:text-base">
                  Welcome, {session?.user?.name || variant.charAt(0).toUpperCase() + variant.slice(1)}
                </span>
              </div>
              
              {/* Notifications Dropdown */}
              <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-white hover:bg-white/20"
                  onClick={handleNotificationClick}
                >
                  <Bell className="w-4 h-4 md:w-5 md:h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#d38d38] text-white border-0"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 md:w-80 max-h-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-6 px-2"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all read
                      </Button>
                    )}
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex-col items-start p-3 cursor-pointer"
                        onClick={() => {
                          if (!notification.is_read) {
                            markNotificationAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between w-full">
                          <p className={`text-sm leading-tight pr-2 ${notification.is_read ? 'text-muted-foreground' : 'font-medium'}`}>
                            {notification.message}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-[#d38d38] rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
                {notifications.length > 10 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-center text-sm text-muted-foreground">
                      View all notifications
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
              <Button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className={`flex items-center space-x-1 px-2 md:px-3 py-1.5 rounded-md ${styles.buttonBg} ${styles.buttonHover} transition-colors text-white text-sm md:text-base`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-nunito">Please provide your name</DialogTitle>
            <DialogDescription className="font-nunito">
              We need your name to personalize your experience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Enter your full name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={updateName} disabled={isUpdating || !name.trim()}>
              {isUpdating ? 'Updating...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}