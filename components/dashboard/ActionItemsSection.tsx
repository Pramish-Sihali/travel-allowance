'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  ExternalLink,
  Play,
  CheckCircle2,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import TimerControls from '@/components/common/TimerControls';

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectTitle?: string;
  meetingId?: string;
  meetingTitle?: string;
  assignedTo?: string;
  assignedToName?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  departmentName?: string;
  isMeetingActionItem?: boolean;
  meetingActionItemId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ActionItemsSectionProps {
  className?: string;
}

export default function ActionItemsSection({ className = "" }: ActionItemsSectionProps) {
  const { data: session } = useSession();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  const userId = session?.user?.id;
  const userName = session?.user?.name;

  useEffect(() => {
    if (userId) {
      fetchActionItems();
    }
  }, [userId]);

  const fetchActionItems = async () => {
    setLoading(true);
    try {
      // Fetch tasks (which includes meeting action items)
      const response = await fetch(`/api/tasks?assignedTo=${userId}&status=active`);
      if (response.ok) {
        const data = await response.json();
        
        // Extract action items from projects and meeting action items
        const items: ActionItem[] = [];
        
        data.forEach((task: any) => {
          if (task.isMeetingActionItem) {
            // This is a meeting action item converted to task format
            items.push({
              id: task.meetingActionItemId || task.id,
              title: task.title.replace('[Meeting] ', ''),
              description: task.description,
              meetingId: task.meetingId,
              meetingTitle: task.meetingTitle,
              assignedTo: task.assignedUserIds?.[0] || userId,
              assignedToName: task.assignedTo?.[0] || userName,
              priority: task.priority,
              status: task.status === 'Completed' ? 'completed' : 
                     task.status === 'In Progress' ? 'in_progress' : 'pending',
              dueDate: task.dueDate,
              departmentName: 'Meeting Actions',
              isMeetingActionItem: true,
              meetingActionItemId: task.meetingActionItemId,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt
            });
          } else if (task.status !== 'Completed' && task.status !== 'Cancelled') {
            // This is a regular project - add it as an action item
            items.push({
              id: task.id,
              title: task.title,
              description: task.description,
              projectId: task.id,
              projectTitle: task.title,
              assignedTo: task.assignedUserIds?.[0] || userId,
              assignedToName: task.assignedTo?.[0] || userName,
              priority: task.priority,
              status: task.status === 'Completed' ? 'completed' : 
                     task.status === 'In Progress' ? 'in_progress' : 'pending',
              dueDate: task.dueDate,
              departmentName: task.departmentName,
              isMeetingActionItem: false,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt
            });
          }
        });

        // Sort by priority and due date
        items.sort((a, b) => {
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) return bPriority - aPriority;
          
          // Then by due date
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          
          // Finally by created date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setActionItems(items);
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async (item: ActionItem) => {
    if (updatingItems.has(item.id)) return;
    
    setUpdatingItems(prev => new Set([...prev, item.id]));
    
    try {
      if (item.isMeetingActionItem) {
        // Update meeting action item
        const response = await fetch(`/api/meeting-minutes/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completion_status: 'completed',
            is_done: true,
            completed_at: new Date().toISOString(),
            completed_by: userId,
            completed_by_name: userName
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update meeting action item');
        }
      } else {
        // Update regular task
        const response = await fetch(`/api/tasks/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Completed',
            completionDate: new Date().toISOString().split('T')[0]
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update task');
        }
      }
      
      // Refresh the action items
      await fetchActionItems();
      
    } catch (error) {
      console.error('Error marking item as done:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleStartTimer = (item: ActionItem) => {
    setSelectedItem(item);
    setShowTimer(true);
  };

  const handleTimerComplete = async (timeLog: any) => {
    setShowTimer(false);
    setSelectedItem(null);
    // Refresh action items to reflect any updates
    await fetchActionItems();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'Not Started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days overdue`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Filter to only show non-completed items
  const activeActionItems = actionItems.filter(item => 
    item.status !== 'completed' && item.status !== 'Completed'
  );

  const completedToday = actionItems.filter(item => {
    if (item.status !== 'completed' && item.status !== 'Completed') return false;
    if (!item.updatedAt) return false;
    
    const today = new Date();
    const updatedDate = new Date(item.updatedAt);
    return updatedDate.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            My Action Items
            {activeActionItems.length > 0 && (
              <Badge variant="secondary">
                {activeActionItems.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {completedToday > 0 && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {completedToday} done today
              </Badge>
            )}
            <Link href="/tasks">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeActionItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pending action items</p>
            <p className="text-xs">Great job! All your tasks are complete.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeActionItems.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleMarkAsDone(item)}
                  disabled={updatingItems.has(item.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm leading-tight flex items-center gap-2">
                        {item.title}
                        {isOverdue(item.dueDate) && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        {item.isMeetingActionItem && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Meeting
                          </Badge>
                        )}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartTimer(item)}
                        className="h-6 w-6 p-0"
                        title="Start timer"
                      >
                        <Timer className="h-3 w-3" />
                      </Button>
                      <Link href={item.isMeetingActionItem ? `/mom?meeting=${item.meetingId}` : `/tasks/${item.projectId}`}>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className={getStatusColor(item.status)} variant="outline">
                      {item.status === 'pending' ? 'Not Started' : 
                       item.status === 'in_progress' ? 'In Progress' : item.status}
                    </Badge>
                    <Badge className={getPriorityColor(item.priority)} variant="outline">
                      {item.priority}
                    </Badge>
                    {item.departmentName && (
                      <Badge variant="outline" className="text-xs">
                        {item.departmentName}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {item.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className={isOverdue(item.dueDate) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(item.dueDate)}
                        </span>
                      </div>
                    )}
                    {item.assignedToName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{item.assignedToName}</span>
                      </div>
                    )}
                    {item.meetingTitle && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <span>from "{item.meetingTitle}"</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {activeActionItems.length > 6 && (
              <div className="text-center pt-2">
                <Link href="/tasks">
                  <Button variant="outline" size="sm">
                    View {activeActionItems.length - 6} more items →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Timer Controls */}
        {showTimer && selectedItem && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm mb-3">
              Tracking time for: {selectedItem.title}
            </h4>
            <TimerControls
              taskId={selectedItem.isMeetingActionItem ? undefined : selectedItem.projectId}
              meetingActionItemId={selectedItem.isMeetingActionItem ? selectedItem.id : undefined}
              taskTitle={selectedItem.title}
              onTimerComplete={handleTimerComplete}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimer(false)}
              className="mt-2"
            >
              Cancel Timer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}