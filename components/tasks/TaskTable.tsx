'use client';

import { useState } from 'react';
import { Edit, Calendar, Users, AlertTriangle, CheckCircle, MoreVertical, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Task, TaskStatus, TaskPriority, RagStatus } from '@/types';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface TaskTableProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskView: (task: Task) => void;
  onMarkAsDone?: (task: Task) => void;
  statusColors: Record<TaskStatus, string>;
  priorityColors: Record<TaskPriority, string>;
  ragColors: Record<RagStatus, string>;
}

export function TaskTable({ 
  tasks, 
  onTaskEdit, 
  onTaskView, 
  onMarkAsDone,
  statusColors, 
  priorityColors, 
  ragColors 
}: TaskTableProps) {
  const { data: session } = useSession();
  const { startTimer, currentLog, isRunning } = useTimeTracker(session?.user?.id || '');
  const [sortField, setSortField] = useState<keyof Task>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (task: Task) => {
    return task.dueDate && 
           new Date(task.dueDate) < new Date() && 
           task.status !== 'Completed';
  };

  const handleStartTimer = async (task: Task) => {
    try {
      if (task.isMeetingActionItem) {
        // For meeting action items, pass the meeting action item ID as the third parameter
        startTimer(task.title, undefined, task.meetingActionItemId, false);
      } else {
        // For regular tasks, use the task ID as the second parameter
        startTimer(task.title, task.id, undefined, false);
      }
      toast.success('Timer started successfully!');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
          <Users className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No tasks found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or create a new task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border overflow-x-auto">
      <Table className="w-full min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('title')}
            >
              Task Title
              {sortField === 'title' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('departmentName')}
            >
              Department
              {sortField === 'departmentName' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status')}
            >
              Status
              {sortField === 'status' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('priority')}
            >
              Priority
              {sortField === 'priority' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead>RAG</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('dueDate')}
            >
              Due Date
              {sortField === 'dueDate' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow key={task.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onTaskView(task)}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  {isOverdue(task) && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {task.departmentName || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {task.assignedTo.slice(0, 2).map((person, index) => (
                    <div key={index} className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3" />
                      <span>{person}</span>
                    </div>
                  ))}
                  {task.assignedTo.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{task.assignedTo.length - 2} more
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[task.status]} variant="outline">
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColors[task.priority]} variant="outline">
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div 
                  className={`w-4 h-4 rounded-full ${ragColors[task.ragStatus]}`}
                  title={`RAG Status: ${task.ragStatus}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  {task.dueDate ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                        {formatDate(task.dueDate)}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No due date</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskView(task);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskEdit(task);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTimer(task);
                      }}
                      disabled={isRunning}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isRunning ? 'Timer Running' : 'Start Timer'}
                    </DropdownMenuItem>
                    {task.status !== 'Completed' && onMarkAsDone && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsDone(task);
                        }}
                        className="text-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Done
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}