'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Edit, 
  Plus, 
  User, 
  Timer, 
  ArrowLeft,
  Save,
  X,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
  CheckSquare
} from 'lucide-react';
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
import TaskActionItems from './TaskActionItems';
import Link from 'next/link';

interface TimeLog {
  id: string;
  hoursSpent: number;
}

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


interface TaskDetailPageProps {
  taskId: string;
}

export default function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [timeLogComments, setTimeLogComments] = useState<{[key: string]: any[]}>({});
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  
  // Form visibility states
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Form data states
  const [newStatus, setNewStatus] = useState<TaskStatus>('Not Started');
  const [updateRemark, setUpdateRemark] = useState('');
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    status: 'Not Started' as TaskStatus,
    priority: 'Medium' as TaskPriority,
    ragStatus: 'Unrated' as RagStatus,
    startDate: '',
    dueDate: '',
    bottlenecks: '',
    ragTakeaway: '',
    remarks: ''
  });
  const [timeLogData, setTimeLogData] = useState({
    taskType: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    hoursSpent: ''
  });
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
      fetchUsers();
      fetchTimeLogs();
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
        // Populate edit form with current task data
        setEditTaskData({
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'Not Started',
          priority: data.priority || 'Medium',
          ragStatus: data.ragStatus || 'Unrated',
          startDate: data.startDate || '',
          dueDate: data.dueDate || '',
          bottlenecks: data.bottlenecks || '',
          ragTakeaway: data.ragTakeaway || '',
          remarks: data.remarks || ''
        });
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

  const handleEditTask = async () => {
    if (!editTaskData.title.trim()) {
      toast.error('Please enter a task title');
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
          ...editTaskData,
          updateRemark: 'Task details updated'
        })
      });

      if (response.ok) {
        setShowEditForm(false);
        fetchTaskDetails();
        fetchTaskUpdates();
        toast.success('Task updated successfully');
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
    <div className="space-y-8">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEditForm(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
          {session?.user?.role === 'approver' && (
            <Button 
              size="sm"
              onClick={() => setShowCreateTaskForm(!showCreateTaskForm)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          )}
        </div>
      </div>

      {/* Main Task Header Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">{task.title}</h1>
                  {isOverdue && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed ml-11">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* Enhanced Status Bar */}
            <div className="flex flex-wrap items-center gap-3 ml-11">
              <Badge className={`${STATUS_COLORS[task.status]} px-3 py-1`} variant="outline">
                {task.status}
              </Badge>
              <Badge className={`${PRIORITY_COLORS[task.priority]} px-3 py-1`} variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {task.priority} Priority
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                <div className={`w-3 h-3 rounded-full ${RAG_COLORS[task.ragStatus]}`} />
                {task.ragStatus} Status
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {task.departmentName}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                <Timer className="h-3 w-3" />
                {getTotalHours()}h logged
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Task Form */}
      {showEditForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Task Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editTitle">Task Title *</Label>
                <Input
                  id="editTitle"
                  value={editTaskData.title}
                  onChange={(e) => setEditTaskData({...editTaskData, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select 
                  value={editTaskData.status} 
                  onValueChange={(value) => setEditTaskData({...editTaskData, status: value as TaskStatus})}
                >
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
                <Label htmlFor="editPriority">Priority</Label>
                <Select 
                  value={editTaskData.priority} 
                  onValueChange={(value) => setEditTaskData({...editTaskData, priority: value as TaskPriority})}
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
                <Label htmlFor="editRagStatus">RAG Status</Label>
                <Select 
                  value={editTaskData.ragStatus} 
                  onValueChange={(value) => setEditTaskData({...editTaskData, ragStatus: value as RagStatus})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Amber">Amber</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Unrated">Unrated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={editTaskData.startDate}
                  onChange={(e) => setEditTaskData({...editTaskData, startDate: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="editDueDate">Due Date</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={editTaskData.dueDate}
                  onChange={(e) => setEditTaskData({...editTaskData, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editTaskData.description}
                onChange={(e) => setEditTaskData({...editTaskData, description: e.target.value})}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="editBottlenecks">Bottlenecks</Label>
              <Textarea
                id="editBottlenecks"
                value={editTaskData.bottlenecks}
                onChange={(e) => setEditTaskData({...editTaskData, bottlenecks: e.target.value})}
                placeholder="Describe any bottlenecks or blockers..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="editRagTakeaway">RAG Takeaway</Label>
              <Textarea
                id="editRagTakeaway"
                value={editTaskData.ragTakeaway}
                onChange={(e) => setEditTaskData({...editTaskData, ragTakeaway: e.target.value})}
                placeholder="RAG status explanation and takeaways..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="editRemarks">Remarks</Label>
              <Textarea
                id="editRemarks"
                value={editTaskData.remarks}
                onChange={(e) => setEditTaskData({...editTaskData, remarks: e.target.value})}
                placeholder="Additional remarks or notes..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEditTask} disabled={loading}>
                {loading ? 'Updating...' : 'Update Task'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-muted-foreground">Start Date</span>
                <span className="text-sm font-semibold">{formatDate(task.startDate)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-muted-foreground">Due Date</span>
                <span className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-muted-foreground">Completed</span>
                <span className="text-sm font-semibold">{formatDate(task.completionDate)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-muted-foreground">Created</span>
                <span className="text-sm font-semibold">{formatDate(task.createdAt.split('T')[0])}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Assigned Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {task.assignedTo.length > 0 ? (
              <div className="space-y-3">
                {task.assignedTo.map((person, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      {person.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{person}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No team members assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Activity Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50">
                <span className="text-sm font-medium text-blue-700">Time Logs</span>
                <span className="text-sm font-bold text-blue-800">{timeLogs.length} entries</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50">
                <span className="text-sm font-medium text-green-700">Total Hours</span>
                <span className="text-sm font-bold text-green-800">{getTotalHours()}h</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50">
                <span className="text-sm font-medium text-purple-700">Updates</span>
                <span className="text-sm font-bold text-purple-800">{updates.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100/50">
                <span className="text-sm font-medium text-orange-700">Comments</span>
                <span className="text-sm font-bold text-orange-800">
                  {Object.values(timeLogComments).reduce((total, comments) => total + comments.length, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Enhanced Create Task Form */}
      {showCreateTaskForm && session?.user?.role === 'approver' && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                Create New Task
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCreateTaskForm(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="taskTitle" className="text-sm font-semibold">Task Title *</Label>
                <Input
                  id="taskTitle"
                  value={createTaskData.title}
                  onChange={(e) => setCreateTaskData({...createTaskData, title: e.target.value})}
                  placeholder="Enter a clear, concise task title"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignTo" className="text-sm font-semibold">Assign To *</Label>
                <Select 
                  value={createTaskData.assignedTo} 
                  onValueChange={(value) => setCreateTaskData({...createTaskData, assignedTo: value})}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name} ({user.email})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskPriority" className="text-sm font-semibold">Priority</Label>
                <Select 
                  value={createTaskData.priority} 
                  onValueChange={(value) => setCreateTaskData({...createTaskData, priority: value as TaskPriority})}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Low Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Medium Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        High Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="Critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Critical Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskDueDate" className="text-sm font-semibold">Due Date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={createTaskData.dueDate}
                  onChange={(e) => setCreateTaskData({...createTaskData, dueDate: e.target.value})}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDescription" className="text-sm font-semibold">Task Description</Label>
              <Textarea
                id="taskDescription"
                value={createTaskData.description}
                onChange={(e) => setCreateTaskData({...createTaskData, description: e.target.value})}
                placeholder="Provide detailed information about the task objectives, requirements, and expected outcomes..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button 
                onClick={handleCreateTask} 
                disabled={loading}
                className="px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateTaskForm(false)}
                className="px-6 py-2"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Additional Information Section */}
      {(task.bottlenecks || task.ragTakeaway || task.remarks) && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Additional Information</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {task.bottlenecks && (
              <Card className="border-0 shadow-md border-l-4 border-l-red-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Bottlenecks & Blockers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{task.bottlenecks}</p>
                </CardContent>
              </Card>
            )}

            {task.ragTakeaway && (
              <Card className="border-0 shadow-md border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    RAG Status Takeaway
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{task.ragTakeaway}</p>
                </CardContent>
              </Card>
            )}

            {task.remarks && (
              <Card className="border-0 shadow-md border-l-4 border-l-green-500 lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    General Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{task.remarks}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Action Items Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Action Items</h2>
        </div>
        
        <TaskActionItems 
          taskId={taskId}
          currentUserId={session?.user?.id}
          currentUserName={session?.user?.name || undefined}
          isReadOnly={false}
        />
      </div>

      {/* Task Updates & History */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Updates & History</h2>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            {updates.length > 0 ? (
              <div className="space-y-6">
                {updates.map((update, index) => (
                  <div key={update.id} className="relative">
                    {index < updates.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-primary/20 to-transparent" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <Clock className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{update.updatedByName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(update.createdAt)}
                          </span>
                        </div>
                        
                        {update.updateType === 'status_change' && (
                          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-sm">Status changed from </span>
                            <Badge variant="outline" className="text-xs">
                              {update.oldValue}
                            </Badge>
                            <span className="text-sm"> to </span>
                            <Badge variant="outline" className="text-xs">
                              {update.newValue}
                            </Badge>
                          </div>
                        )}
                        
                        {update.remarks && (
                          <div className="p-3 bg-muted/20 rounded-lg">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {update.remarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No updates or history yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Task activities will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}