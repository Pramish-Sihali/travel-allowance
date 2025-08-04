'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Users, AlertCircle, Clock, MessageSquare, Edit, Plus, Timer, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Task, TaskUpdate, TaskStatus, TaskPriority, RagStatus } from '@/types';
import { toast } from 'sonner';

const STATUS_COLORS: Record<TaskStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-800 border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Completed': 'bg-green-100 text-green-800 border-green-200',
  'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200'
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-100 text-blue-600',
  'High': 'bg-orange-100 text-orange-600',
  'Critical': 'bg-red-100 text-red-600'
};

const RAG_COLORS: Record<RagStatus, string> = {
  'Red': 'bg-red-500',
  'Amber': 'bg-yellow-500',
  'Green': 'bg-green-500',
  'Unrated': 'bg-gray-300'
};

const TASK_TYPES = [
  'Desk Research',
  'Field Visit',
  'Report Writing',
  'Interview/Consultation Meetings',
  'Visuals and Designing',
  'Data Analysis/Interpretation',
  'Finance/Administrative Tasks'
];

interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  taskType: string;
  description: string;
  date: string;
  hoursSpent: number;
  createdAt: string;
}

interface TimeLogComment {
  id: string;
  timeLogId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

interface TaskDetailPageProps {
  taskId: string;
}

export default function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const { data: session } = useSession();
  const [task, setTask] = useState<Task | null>(null);
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [timeLogComments, setTimeLogComments] = useState<{[key: string]: TimeLogComment[]}>({});
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus>('Not Started');
  const [updateRemark, setUpdateRemark] = useState('');
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  const [users, setUsers] = useState<any[]>([]);
  
  // Time log form state
  const [timeLogData, setTimeLogData] = useState({
    taskType: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    hoursSpent: ''
  });

  // Create task form state
  const [createTaskData, setCreateTaskData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium' as TaskPriority,
    dueDate: ''
  });

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
      fetchTaskUpdates();
      fetchTimeLogs();
      fetchUsers();
    }
  }, [taskId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/employees');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        setNewStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskUpdates = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/updates`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      }
    } catch (error) {
      console.error('Error fetching task updates:', error);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-logs`);
      if (response.ok) {
        const data = await response.json();
        setTimeLogs(data);
        
        // Fetch comments for each time log
        data.forEach((log: TimeLog) => {
          fetchTimeLogComments(log.id);
        });
      }
    } catch (error) {
      console.error('Error fetching time logs:', error);
    }
  };

  const fetchTimeLogComments = async (timeLogId: string) => {
    try {
      const response = await fetch(`/api/time-logs/${timeLogId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setTimeLogComments(prev => ({
          ...prev,
          [timeLogId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching time log comments:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!updateRemark.trim()) {
      toast.error('Please provide a remark for the status update');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
          updateRemark
        })
      });

      if (response.ok) {
        setShowUpdateForm(false);
        setUpdateRemark('');
        fetchTaskDetails();
        fetchTaskUpdates();
        toast.success('Task status updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!updateRemark.trim()) {
      toast.error('Please provide a remark');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updateType: 'remark',
          remarks: updateRemark
        })
      });

      if (response.ok) {
        setUpdateRemark('');
        fetchTaskUpdates();
        toast.success('Remark added successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add remark');
      }
    } catch (error) {
      console.error('Error adding remark:', error);
      toast.error('Failed to add remark');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeLog = async () => {
    if (!timeLogData.taskType || !timeLogData.description || !timeLogData.hoursSpent) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(timeLogData.hoursSpent) <= 0) {
      toast.error('Hours spent must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskType: timeLogData.taskType,
          description: timeLogData.description,
          date: timeLogData.date,
          hoursSpent: parseFloat(timeLogData.hoursSpent)
        })
      });

      if (response.ok) {
        setTimeLogData({
          taskType: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          hoursSpent: ''
        });
        setShowTimeLogForm(false);
        fetchTimeLogs();
        toast.success('Time log added successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add time log');
      }
    } catch (error) {
      console.error('Error adding time log:', error);
      toast.error('Failed to add time log');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (timeLogId: string) => {
    const comment = commentText[timeLogId];
    if (!comment || !comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const response = await fetch(`/api/time-logs/${timeLogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: comment.trim() })
      });

      if (response.ok) {
        setCommentText(prev => ({
          ...prev,
          [timeLogId]: ''
        }));
        fetchTimeLogComments(timeLogId);
        toast.success('Comment added successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleCreateTask = async () => {
    if (!createTaskData.title || !createTaskData.assignedTo) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: createTaskData.title,
          description: createTaskData.description,
          assignedTo: [createTaskData.assignedTo],
          priority: createTaskData.priority,
          dueDate: createTaskData.dueDate,
          status: 'Not Started',
          ragStatus: 'Unrated',
          departmentId: task?.departmentId || '',
          createdBy: session?.user?.name || session?.user?.email
        })
      });

      if (response.ok) {
        setCreateTaskData({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'Medium',
          dueDate: ''
        });
        setShowCreateTaskForm(false);
        toast.success('Task created successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalHours = () => {
    return timeLogs.reduce((total, log) => total + log.hoursSpent, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading task details...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Task not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = task.dueDate && 
                   new Date(task.dueDate) < new Date() && 
                   task.status !== 'Completed';

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{task.title}</h2>
                {task.description && (
                  <p className="text-muted-foreground">{task.description}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {isOverdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTimeLogForm(!showTimeLogForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Log
                </Button>
                {session?.user?.role === 'approver' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateTaskForm(!showCreateTaskForm)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>
            </div>

            {/* Status and Priority Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={STATUS_COLORS[task.status]} variant="outline">
                {task.status}
              </Badge>
              <Badge className={PRIORITY_COLORS[task.priority]} variant="outline">
                {task.priority} Priority
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${RAG_COLORS[task.ragStatus]}`} />
                {task.ragStatus}
              </Badge>
              <Badge variant="outline">
                {task.departmentName}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {getTotalHours()}h logged
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Start Date:</span>
              <span className="text-sm">{formatDate(task.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Due Date:</span>
              <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                {formatDate(task.dueDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Completed:</span>
              <span className="text-sm">{formatDate(task.completionDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm">{formatDate(task.createdAt.split('T')[0])}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {task.assignedTo.length > 0 ? (
              <div className="space-y-2">
                {task.assignedTo.map((person, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {person.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{person}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No one assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Management Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Task Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created By:</span>
              <span className="text-sm">{(task as any).createdByName || session?.user?.name || 'Unknown'}</span>
            </div>
            {(task as any).approvedByName && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Approved By:</span>
                  <span className="text-sm">{(task as any).approvedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Approved At:</span>
                  <span className="text-sm">{formatDateTime((task as any).approvedAt)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Time Logs:</span>
              <span className="text-sm">{timeLogs.length} entries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Hours:</span>
              <span className="text-sm">{getTotalHours()}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Updates:</span>
              <span className="text-sm">{updates.length} updates</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Comments:</span>
              <span className="text-sm">
                {Object.values(timeLogComments).reduce((total, comments) => total + comments.length, 0)} comments
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Log Form */}
      {showTimeLogForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Add Time Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taskType">Task Type *</Label>
                <Select 
                  value={timeLogData.taskType} 
                  onValueChange={(value) => setTimeLogData({...timeLogData, taskType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={timeLogData.date}
                  onChange={(e) => setTimeLogData({...timeLogData, date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="hoursSpent">Hours Spent *</Label>
                <Input
                  id="hoursSpent"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={timeLogData.hoursSpent}
                  onChange={(e) => setTimeLogData({...timeLogData, hoursSpent: e.target.value})}
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description/Sub-category *</Label>
              <Textarea
                id="description"
                value={timeLogData.description}
                onChange={(e) => setTimeLogData({...timeLogData, description: e.target.value})}
                placeholder="Describe what you worked on in detail..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddTimeLog} disabled={loading}>
                {loading ? 'Adding...' : 'Add Time Log'}
              </Button>
              <Button variant="outline" onClick={() => setShowTimeLogForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Task Form */}
      {showCreateTaskForm && session?.user?.role === 'approver' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  value={createTaskData.title}
                  onChange={(e) => setCreateTaskData({...createTaskData, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <Label htmlFor="assignTo">Assign To *</Label>
                <Select 
                  value={createTaskData.assignedTo} 
                  onValueChange={(value) => setCreateTaskData({...createTaskData, assignedTo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taskPriority">Priority</Label>
                <Select 
                  value={createTaskData.priority} 
                  onValueChange={(value) => setCreateTaskData({...createTaskData, priority: value as TaskPriority})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taskDueDate">Due Date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={createTaskData.dueDate}
                  onChange={(e) => setCreateTaskData({...createTaskData, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={createTaskData.description}
                onChange={(e) => setCreateTaskData({...createTaskData, description: e.target.value})}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTask} disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateTaskForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Update Form */}
      {showUpdateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Task Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="updateRemark">Update Remark *</Label>
              <Textarea
                id="updateRemark"
                value={updateRemark}
                onChange={(e) => setUpdateRemark(e.target.value)}
                placeholder="Explain the status change or provide updates..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleStatusUpdate} disabled={loading}>
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
              <Button variant="outline" onClick={handleAddRemark} disabled={loading}>
                {loading ? 'Adding...' : 'Add Remark Only'}
              </Button>
              <Button variant="outline" onClick={() => setShowUpdateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Time Logs ({getTotalHours()} hours total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeLogs.length > 0 ? (
            <div className="space-y-6">
              {timeLogs.map((log, index) => (
                <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Timer className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.userName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {log.taskType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.hoursSpent}h
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.date)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {log.description}
                      </p>
                      
                      <span className="text-xs text-muted-foreground">
                        Logged on {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="ml-11 space-y-3">
                    {/* Existing Comments */}
                    {timeLogComments[log.id] && timeLogComments[log.id].length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700">Comments:</h4>
                        {timeLogComments[log.id].map((comment) => (
                          <div key={comment.id} className="bg-white rounded p-2 border-l-2 border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{comment.userName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentText[log.id] || ''}
                        onChange={(e) => setCommentText(prev => ({
                          ...prev,
                          [log.id]: e.target.value
                        }))}
                        className="flex-1 text-sm"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(log.id)}
                        className="self-end"
                        disabled={!commentText[log.id]?.trim()}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No time logs yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(task.bottlenecks || task.ragTakeaway || task.remarks) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>
          
          {task.bottlenecks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Bottlenecks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.bottlenecks}</p>
              </CardContent>
            </Card>
          )}

          {task.ragTakeaway && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">RAG Takeaway</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.ragTakeaway}</p>
              </CardContent>
            </Card>
          )}

          {task.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Task Updates History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Updates & History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div key={update.id}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{update.updatedByName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(update.createdAt)}
                        </span>
                      </div>
                      
                      {update.updateType === 'status_change' && (
                        <div className="text-sm">
                          Status changed from{' '}
                          <Badge variant="outline" className="text-xs">
                            {update.oldValue}
                          </Badge>
                          {' '}to{' '}
                          <Badge variant="outline" className="text-xs">
                            {update.newValue}
                          </Badge>
                        </div>
                      )}
                      
                      {update.remarks && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {update.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                  {index < updates.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No updates yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}