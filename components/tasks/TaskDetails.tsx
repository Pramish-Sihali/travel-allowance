'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Users, AlertCircle, Clock, MessageSquare, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Task, TaskUpdate, TaskStatus, TaskPriority, RagStatus } from '@/types';

interface TaskDetailsProps {
  task: Task;
  onTaskUpdated: () => void;
  onCancel: () => void;
  statusColors: Record<TaskStatus, string>;
  priorityColors: Record<TaskPriority, string>;
  ragColors: Record<RagStatus, string>;
}

export function TaskDetails({ 
  task, 
  onTaskUpdated, 
  onCancel, 
  statusColors, 
  priorityColors, 
  ragColors 
}: TaskDetailsProps) {
  const { data: session } = useSession();
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newStatus, setNewStatus] = useState(task.status);
  const [updateRemark, setUpdateRemark] = useState('');

  useEffect(() => {
    fetchTaskUpdates();
  }, [task.id]);

  const fetchTaskUpdates = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/updates`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      }
    } catch (error) {
      console.error('Error fetching task updates:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!updateRemark.trim()) {
      alert('Please provide a remark for the status update');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
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
        onTaskUpdated();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!updateRemark.trim()) {
      alert('Please provide a remark');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/updates`, {
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add remark');
      }
    } catch (error) {
      console.error('Error adding remark:', error);
      alert('Failed to add remark');
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

  const isOverdue = task.dueDate && 
                   new Date(task.dueDate) < new Date() && 
                   task.status !== 'Completed';

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Task Details</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowUpdateForm(!showUpdateForm)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{task.title}</h2>
                {task.description && (
                  <p className="text-muted-foreground">{task.description}</p>
                )}
              </div>
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>

            {/* Status and Priority Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={statusColors[task.status]} variant="outline">
                {task.status}
              </Badge>
              <Badge className={priorityColors[task.priority]} variant="outline">
                {task.priority} Priority
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${ragColors[task.ragStatus]}`} />
                {task.ragStatus}
              </Badge>
              <Badge variant="outline">
                {task.departmentName}
              </Badge>
            </div>
          </div>

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
                </div>
              </CardContent>
            </Card>
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
      </DialogContent>
    </Dialog>
  );
}