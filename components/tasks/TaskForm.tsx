'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Task, Department, TaskStatus, TaskPriority, RagStatus } from '@/types';

interface TaskFormProps {
  task?: Task | null;
  departments: Department[];
  open: boolean;
  onSave: () => void;
  onCancel: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  departmentId: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
  ragStatus: RagStatus;
  dueDate: string;
  startDate: string;
  bottlenecks: string;
  ragTakeaway: string;
  remarks: string;
}

export function TaskForm({ task, departments, open, onSave, onCancel }: TaskFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [assignedPersons, setAssignedPersons] = useState<string[]>(task?.assignedTo || []);
  const [newPerson, setNewPerson] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TaskFormData>({
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      departmentId: task.departmentId,
      assignedTo: '',
      status: task.status,
      priority: task.priority,
      ragStatus: task.ragStatus,
      dueDate: task.dueDate || '',
      startDate: task.startDate || '',
      bottlenecks: task.bottlenecks || '',
      ragTakeaway: task.ragTakeaway || '',
      remarks: task.remarks || ''
    } : {
      status: 'Not Started',
      priority: 'Medium',
      ragStatus: 'Unrated',
      assignedTo: '',
      title: '',
      description: '',
      departmentId: '',
      dueDate: '',
      startDate: '',
      bottlenecks: '',
      ragTakeaway: '',
      remarks: ''
    }
  });

  const selectedDepartmentId = watch('departmentId');
  const selectedStatus = watch('status');

  // Fetch users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/employees');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const addAssignedPerson = () => {
    if (newPerson.trim() && !assignedPersons.includes(newPerson.trim())) {
      setAssignedPersons([...assignedPersons, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removeAssignedPerson = (person: string) => {
    setAssignedPersons(assignedPersons.filter(p => p !== person));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAssignedPerson();
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      const taskData = {
        ...data,
        assignedTo: assignedPersons,
        completionDate: data.status === 'Completed' ? new Date().toISOString().split('T')[0] : null
      };

      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Task title is required' })}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="departmentId">Department *</Label>
              <Select 
                value={selectedDepartmentId} 
                onValueChange={(value) => setValue('departmentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-sm text-red-600 mt-1">Department is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={watch('priority') || 'Medium'} 
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
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
              <Label htmlFor="status">Status</Label>
              <Select 
                value={selectedStatus || 'Not Started'} 
                onValueChange={(value) => setValue('status', value as TaskStatus)}
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
              <Label htmlFor="ragStatus">RAG Status</Label>
              <Select 
                value={watch('ragStatus') || 'Unrated'} 
                onValueChange={(value) => setValue('ragStatus', value as RagStatus)}
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
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignedPersons">Assigned Persons</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select value={newPerson} onValueChange={setNewPerson}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user to assign"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addAssignedPerson} disabled={!newPerson}>
                  Add
                </Button>
              </div>
              {assignedPersons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignedPersons.map((person, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {person}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeAssignedPerson(person)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="bottlenecks">Bottlenecks</Label>
            <Textarea
              id="bottlenecks"
              {...register('bottlenecks')}
              placeholder="Describe any bottlenecks or issues"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="ragTakeaway">RAG Takeaway</Label>
            <Textarea
              id="ragTakeaway"
              {...register('ragTakeaway')}
              placeholder="RAG status explanation or takeaway"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              {...register('remarks')}
              placeholder="Additional remarks or notes"
              rows={2}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}