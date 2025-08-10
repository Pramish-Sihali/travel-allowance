'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  MapPin,
  Mountain,
  FileText,
  DollarSign,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: 'employee' | 'approver' | 'checker' | 'admin';
}

export default function Sidebar({ userRole = 'employee' }: SidebarProps) {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: `/${userRole}/dashboard`,
      icon: Home,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Projects',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Travel Requests',
      href: '/requests',
      icon: MapPin,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Valley Requests',
      href: '/valley-requests',
      icon: Mountain,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Leave Requests',
      href: '/leave-requests',
      icon: FileText,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: DollarSign,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Attendance',
      href: '/attendance-sheet',
      icon: Clock,
      roles: ['approver', 'checker', 'admin']
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Meeting Minutes',
      href: '/mom',
      icon: Users,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Follow-up',
      href: '/follow-up',
      icon: CheckSquare,
      roles: ['employee', 'approver', 'checker', 'admin']
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      roles: ['employee', 'approver', 'checker', 'admin']
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    if (href === `/${userRole}/dashboard`) {
      return pathname === href || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-200",
          isCollapsed && "opacity-0 w-0 overflow-hidden"
        )}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">IX</span>
          </div>
          <span className="font-semibold text-sidebar-foreground text-sm">
            IXI Portal
          </span>
        </div>
        
        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>

        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className={cn(
                "transition-all duration-200",
                isCollapsed && "opacity-0 w-0 overflow-hidden"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "text-xs text-sidebar-foreground/60 transition-all duration-200",
          isCollapsed && "opacity-0"
        )}>
          <div className="capitalize font-medium">{userRole} Portal</div>
          <div className="text-sidebar-foreground/40">IXI Employee System</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border"
      >
        <Menu size={18} />
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden md:flex flex-col fixed left-0 top-0 h-full z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-200 md:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}