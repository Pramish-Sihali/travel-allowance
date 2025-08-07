'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Play,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import TimerControls from './TimerControls';

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  departmentName?: string;
  assignedTo: string[];
  ragStatus: 'Red' | 'Amber' | 'Green' | 'Unrated';
  actionItems?: ActionItem[];
  progress?: number;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectCardProps {
  project: Project;
  currentUserId?: string;
  currentUserName?: string;
  onActionItemStart?: (actionItem: ActionItem) => void;
  showTimer?: boolean;
  compact?: boolean;
}

export default function ProjectCard({ 
  project, 
  currentUserId, 
  currentUserName,
  onActionItemStart,
  showTimer = false,
  compact = false 
}: ProjectCardProps) {
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [showTimerControls, setShowTimerControls] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRagColor = (rag: string) => {
    switch (rag) {
      case 'Red':
        return 'bg-red-500';
      case 'Amber':
        return 'bg-yellow-500';
      case 'Green':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && project.status !== 'Completed';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isAssignedToUser = currentUserId && project.assignedTo.some(assignee => 
    assignee.toLowerCase().includes(currentUserName?.toLowerCase() || '') ||
    assignee.includes(currentUserId)
  );

  const availableActionItems = project.actionItems?.filter(item => 
    item.status !== 'Completed' && 
    (isAssignedToUser || item.assignedTo.includes(currentUserId || ''))
  ) || [];

  const handleActionItemStart = (actionItem: ActionItem) => {
    setSelectedActionItem(actionItem);
    setShowTimerControls(true);
    if (onActionItemStart) {
      onActionItemStart(actionItem);
    }
  };

  const handleTimerComplete = (timeLog: any) => {
    setShowTimerControls(false);
    setSelectedActionItem(null);
    // Could trigger a refresh of the project data
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div 
              className={`w-3 h-3 rounded-full mt-2 ${getRagColor(project.ragStatus)}`}
              title={`RAG Status: ${project.ragStatus}`}
            />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm leading-tight flex items-center gap-2">
                    {project.title}
                    {isOverdue(project.dueDate) && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </h4>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <Link href={`/tasks/${project.id}`}>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <Badge className={getStatusColor(project.status)} variant="outline">
                  {project.status}
                </Badge>
                <Badge className={getPriorityColor(project.priority)} variant="outline">
                  {project.priority}
                </Badge>
                {project.departmentName && (
                  <Badge variant="outline" className="text-xs">
                    {project.departmentName}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className={isOverdue(project.dueDate) ? 'text-red-600 font-medium' : ''}>
                    {formatDate(project.dueDate)}
                  </span>
                </div>
                {availableActionItems.length > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    <span>{availableActionItems.length} action items</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div 
              className={`w-4 h-4 rounded-full mt-1 ${getRagColor(project.ragStatus)}`}
              title={`RAG Status: ${project.ragStatus}`}
            />
            <div>
              <div className="flex items-center gap-2">
                {project.title}
                {isOverdue(project.dueDate) && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <Link href={`/tasks/${project.id}`}>
            <Button size="sm" variant="ghost">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getStatusColor(project.status)} variant="outline">
            {project.status}
          </Badge>
          <Badge className={getPriorityColor(project.priority)} variant="outline">
            {project.priority}
          </Badge>
          {project.departmentName && (
            <Badge variant="outline">
              {project.departmentName}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {project.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        )}

        {/* Project Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isOverdue(project.dueDate) ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
              {formatDate(project.dueDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {project.assignedTo.length} assigned
            </span>
          </div>
        </div>

        {/* Available Action Items */}
        {availableActionItems.length > 0 && showTimer && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Available Action Items:</h4>
            <div className="space-y-2">
              {availableActionItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(item.status)} text-xs`} variant="outline">
                        {item.status}
                      </Badge>
                      <Badge className={`${getPriorityColor(item.priority)} text-xs`} variant="outline">
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActionItemStart(item)}
                    className="ml-2"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                </div>
              ))}
              {availableActionItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{availableActionItems.length - 3} more action items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timer Controls */}
        {showTimerControls && selectedActionItem && (
          <TimerControls
            taskId={selectedActionItem.id}
            taskTitle={selectedActionItem.title}
            onTimerComplete={handleTimerComplete}
            className="border-t pt-4"
          />
        )}
      </CardContent>
    </Card>
  );
}