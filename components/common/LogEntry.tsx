'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  User, 
  FileText, 
  Calendar, 
  UserPlus, 
  Settings,
  Play,
  Coffee
} from 'lucide-react';

interface LogEntry {
  id: string;
  projectId?: string;
  userId: string;
  userName: string;
  userInitials?: string;
  description: string;
  timestamp: string;
  duration?: number; // in seconds
  breakDuration?: number; // in seconds
  type: 'update' | 'time_log' | 'status_change' | 'assignment' | 'personal';
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    assignedUsers?: string[];
    taskTitle?: string;
  };
}

interface LogEntryProps {
  log: LogEntry;
  showProjectInfo?: boolean;
  compact?: boolean;
}

export default function LogEntryComponent({ log, showProjectInfo = false, compact = false }: LogEntryProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'time_log':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'update':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'status_change':
        return <Settings className="h-4 w-4 text-orange-600" />;
      case 'assignment':
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'personal':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'time_log':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'update':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'status_change':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'assignment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'personal':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'time_log':
        return 'Time Log';
      case 'update':
        return 'Update';
      case 'status_change':
        return 'Status Change';
      case 'assignment':
        return 'Assignment';
      case 'personal':
        return 'Personal Log';
      default:
        return 'Activity';
    }
  };

  const getUserInitials = (name: string): string => {
    return log.userInitials || name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now.getTime() - logTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return logTime.toLocaleDateString();
  };

  const timeAgo = getTimeAgo(log.timestamp);

  if (compact) {
    return (
      <div className="flex items-start gap-3 py-2">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(log.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{log.userName}</span>
            <Badge variant="outline" className={`text-xs ${getTypeColor(log.type)}`}>
              {getTypeLabel(log.type)}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{log.description}</p>
          {log.duration && log.duration > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Play className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {formatTime(log.duration)}
              </span>
              {log.breakDuration && log.breakDuration > 0 && (
                <>
                  <Coffee className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600">
                    {formatTime(log.breakDuration)} break
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(log.userName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{log.userName}</span>
                <Badge variant="outline" className={getTypeColor(log.type)}>
                  {getTypeIcon(log.type)}
                  <span className="ml-1">{getTypeLabel(log.type)}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-sm text-foreground">{log.description}</p>
              
              {/* Time tracking info */}
              {log.duration && log.duration > 0 && (
                <div className="flex items-center gap-4 p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      Duration: {formatTime(log.duration)}
                    </span>
                  </div>
                  {log.breakDuration && log.breakDuration > 0 && (
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-600">
                        Break: {formatTime(log.breakDuration)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {log.metadata && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {log.metadata.taskTitle && (
                    <p>Task: {log.metadata.taskTitle}</p>
                  )}
                  {log.metadata.oldStatus && log.metadata.newStatus && (
                    <p>Status changed from "{log.metadata.oldStatus}" to "{log.metadata.newStatus}"</p>
                  )}
                  {log.metadata.assignedUsers && log.metadata.assignedUsers.length > 0 && (
                    <p>Assigned to: {log.metadata.assignedUsers.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}