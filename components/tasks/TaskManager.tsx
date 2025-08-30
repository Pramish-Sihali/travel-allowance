'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Filter, Search, Calendar, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskForm } from './TaskForm';
import { TaskTable } from './TaskTable';
import { TaskDetails } from './TaskDetails';
import { Task, Department, TaskStatus, TaskPriority, RagStatus } from '@/types';

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

export default function TaskManager() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [userActionItems, setUserActionItems] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchDepartments();
      fetchUserActionItems();
    }
  }, [isAuthenticated, selectedDepartment]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') {
        params.append('department', selectedDepartment);
      }
      params.append('includeActionItems', 'true');
      params.append('page', '1');
      params.append('limit', '50');
      
      const url = `/api/tasks?${params.toString()}`;
      console.log('Fetching tasks from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Tasks data received:', data);
        
        // Handle new API response format
        if (data.success && data.data) {
          setTasks(data.data.tasks || []);
        } else {
          // Fallback for old format
          setTasks(Array.isArray(data) ? data : data.tasks || []);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch tasks:', response.status, errorData);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format
        if (data.success && data.data) {
          setDepartments(data.data.departments || []);
        } else {
          // Fallback for old format
          setDepartments(Array.isArray(data) ? data : data.departments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchUserActionItems = async () => {
    try {
      const response = await fetch('/api/follow-ups/user?userId=' + session?.user?.id);
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format
        if (data.success && data.data) {
          setUserActionItems(data.data.actionItems || []);
        } else {
          // Fallback for old format
          setUserActionItems(data.actionItems || data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      setUserActionItems([]);
    }
  };

  const handleTaskSaved = () => {
    fetchTasks();
    setShowTaskForm(false);
    setSelectedTask(null);
  };

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleTaskView = (task: Task) => {
    // Navigate to task detail page instead of showing modal
    window.location.href = `/tasks/${task.id}`;
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setShowTaskDetails(false);
    setSelectedTask(null);
  };

  const handleMarkAsDone = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: 'Completed',
          completionDate: new Date().toISOString().split('T')[0],
          updateRemark: 'Marked as completed'
        })
      });

      if (response.ok) {
        fetchTasks();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to mark task as done');
      }
    } catch (error) {
      console.error('Error marking task as done:', error);
      alert('Failed to mark task as done');
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.some(person => person.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Get statistics
  const stats = {
    total: filteredTasks.length,
    notStarted: filteredTasks.filter(t => t.status === 'Not Started').length,
    inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
    completed: filteredTasks.filter(t => t.status === 'Completed').length,
    overdue: filteredTasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'Completed'
    ).length
  };

  // Calculate overall progress percentage
  const overallProgress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Handle stats card clicks
  const handleStatsClick = (filterType: string) => {
    setSelectedStatus(filterType);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Overall Project Progress</h3>
              <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.completed} completed</span>
              <span>{stats.total} total projects</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleStatsClick('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleStatsClick('Not Started')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Not Started</p>
                <p className="text-2xl font-bold">{stats.notStarted}</p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-gray-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleStatsClick('In Progress')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleStatsClick('Completed')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => {
            // For overdue, we'll keep the current filter but the user can see overdue tasks
            setSelectedStatus('all');
            // You could add a separate overdue filter if needed
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items Table */}
      {userActionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              My Action Items ({userActionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action Item</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActionItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.responsibility || item.content}
                          </div>
                          {item.responsibility && item.content && (
                            <div className="text-sm text-muted-foreground">
                              {item.content}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.meeting_title ? (
                            <div>
                              <div className="font-medium">{item.meeting_title}</div>
                              <div className="text-muted-foreground">Meeting</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{item.task_title || 'Task'}</div>
                              <div className="text-muted-foreground">Task</div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.priority === 'urgent' || item.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : item.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {item.priority || 'Medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.completion_status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : item.completion_status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {item.completion_status === 'completed' ? 'Completed' :
                           item.completion_status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.due_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-sm">
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.meeting_title ? 'Meeting Action' : 'Task Action'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Project Management
            </CardTitle>
            {isAuthenticated && (
              <Button onClick={() => setShowTaskForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects, descriptions, or assigned persons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task Table */}
          <TaskTable
            tasks={filteredTasks}
            onTaskEdit={handleTaskEdit}
            onTaskView={handleTaskView}
            onMarkAsDone={handleMarkAsDone}
            statusColors={STATUS_COLORS}
            priorityColors={PRIORITY_COLORS}
            ragColors={RAG_COLORS}
          />
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      <TaskForm
        task={selectedTask}
        departments={departments}
        open={showTaskForm}
        onSave={handleTaskSaved}
        onCancel={() => {
          setShowTaskForm(false);
          setSelectedTask(null);
        }}
      />

    </div>
  );
}