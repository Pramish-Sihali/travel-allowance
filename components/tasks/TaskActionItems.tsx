'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus,
  X, 
  Calendar,
  Check,
  AlertCircle,
  User,
  Flag,
  Trash2,
  CheckSquare
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ActionItem {
  id?: string;
  serialNo: number;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Completed';
  dueDate: string;
  remarks: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface TaskActionItemsProps {
  taskId: string;
  currentUserId?: string;
  currentUserName?: string;
  isReadOnly?: boolean;
}

const PRIORITY_COLORS = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-100 text-blue-600',
  'High': 'bg-orange-100 text-orange-600',
  'Critical': 'bg-red-100 text-red-600'
};

const STATUS_COLORS = {
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800'
};

export default function TaskActionItems({ 
  taskId, 
  currentUserId, 
  currentUserName, 
  isReadOnly = false 
}: TaskActionItemsProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActionItems();
    fetchUsers();
  }, [taskId]);

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${taskId}/action-items`);
      if (response.ok) {
        const data = await response.json();
        setActionItems(data);
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/employees');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addNewActionItem = () => {
    const newItem: ActionItem = {
      serialNo: actionItems.length + 1,
      title: '',
      description: '',
      assignedToId: '',
      assignedToName: '',
      priority: 'Medium',
      status: 'Not Started',
      dueDate: '',
      remarks: '',
      createdBy: currentUserName || ''
    };
    setActionItems([...actionItems, newItem]);
  };

  const removeActionItem = (index: number) => {
    const updatedItems = actionItems.filter((_, i) => i !== index);
    // Re-sequence serial numbers
    const resequenced = updatedItems.map((item, i) => ({
      ...item,
      serialNo: i + 1
    }));
    setActionItems(resequenced);
  };

  const updateActionItem = (index: number, field: keyof ActionItem, value: any) => {
    const updatedItems = [...actionItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If updating assignedToId, also update assignedToName
    if (field === 'assignedToId') {
      const selectedUser = users.find(user => user.id === value);
      if (selectedUser) {
        updatedItems[index].assignedToName = selectedUser.name;
      }
    }

    setActionItems(updatedItems);
  };

  const toggleStatus = async (index: number) => {
    const item = actionItems[index];
    const newStatus = item.status === 'Completed' ? 'Not Started' : 'Completed';
    
    updateActionItem(index, 'status', newStatus);
    
    // If it has an ID, save to backend
    if (item.id) {
      await saveActionItem(index);
    }
  };

  const saveActionItem = async (index: number) => {
    const item = actionItems[index];
    
    if (!item.title.trim() || !item.assignedToId) {
      alert('Please fill in title and assignee');
      return;
    }

    try {
      setLoading(true);
      const url = item.id 
        ? `/api/tasks/${taskId}/action-items/${item.id}`
        : `/api/tasks/${taskId}/action-items`;
      
      const method = item.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...item,
          taskId
        })
      });

      if (response.ok) {
        const savedItem = await response.json();
        const updatedItems = [...actionItems];
        updatedItems[index] = savedItem;
        setActionItems(updatedItems);
      } else {
        alert('Failed to save action item');
      }
    } catch (error) {
      console.error('Error saving action item:', error);
      alert('Failed to save action item');
    } finally {
      setLoading(false);
    }
  };

  const deleteActionItem = async (index: number) => {
    const item = actionItems[index];
    
    if (item.id) {
      try {
        setLoading(true);
        const response = await fetch(`/api/tasks/${taskId}/action-items/${item.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          alert('Failed to delete action item');
          return;
        }
      } catch (error) {
        console.error('Error deleting action item:', error);
        alert('Failed to delete action item');
        return;
      } finally {
        setLoading(false);
      }
    }
    
    removeActionItem(index);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Action Items ({actionItems.length})
          </CardTitle>
          {!isReadOnly && (
            <Button onClick={addNewActionItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Action Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {actionItems.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  {!isReadOnly && <TableHead className="w-32">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionItems.map((item, index) => (
                  <TableRow key={index} className={item.status === 'Completed' ? 'bg-green-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.serialNo}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(index)}
                          className="h-6 w-6 p-0"
                          disabled={isReadOnly}
                        >
                          <Check 
                            className={`h-4 w-4 ${
                              item.status === 'Completed' 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} 
                          />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <div>
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={item.title}
                            onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                            placeholder="Action item title"
                            className="text-sm"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateActionItem(index, 'description', e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.assignedToName}</span>
                        </div>
                      ) : (
                        <Select 
                          value={item.assignedToId} 
                          onValueChange={(value) => updateActionItem(index, 'assignedToId', value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <Badge className={PRIORITY_COLORS[item.priority]}>
                          {item.priority}
                        </Badge>
                      ) : (
                        <Select 
                          value={item.priority} 
                          onValueChange={(value) => updateActionItem(index, 'priority', value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[item.status]}>
                          {item.status}
                        </Badge>
                        {!isReadOnly && item.status !== 'Completed' && (
                          <Select 
                            value={item.status} 
                            onValueChange={(value) => updateActionItem(index, 'status', value)}
                          >
                            <SelectTrigger className="text-sm w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Not Started">Not Started</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-sm ${
                            isOverdue(item.dueDate, item.status) ? 'text-red-600 font-medium' : ''
                          }`}>
                            {formatDate(item.dueDate) || 'No due date'}
                          </span>
                          {isOverdue(item.dueDate, item.status) && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateActionItem(index, 'dueDate', e.target.value)}
                            className="text-sm"
                          />
                          {isOverdue(item.dueDate, item.status) && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <span className="text-sm text-muted-foreground">{item.remarks}</span>
                      ) : (
                        <Textarea
                          value={item.remarks}
                          onChange={(e) => updateActionItem(index, 'remarks', e.target.value)}
                          placeholder="Remarks (optional)"
                          rows={2}
                          className="text-sm"
                        />
                      )}
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => saveActionItem(index)}
                            size="sm"
                            disabled={loading}
                            className="h-8 px-2"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => deleteActionItem(index)}
                            size="sm"
                            variant="destructive"
                            disabled={loading}
                            className="h-8 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No action items yet</p>
            {!isReadOnly && (
              <p className="text-xs mt-1">Click "Add Action Item" to get started</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}