'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Plus,
  X, 
  Calendar,
  Check,
  AlertCircle,
  User,
  Flag,
  Trash2,
  CheckSquare,
  Settings2,
  Eye,
  EyeOff
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
  
  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    serialNo: true,
    title: true,
    assignedTo: true,
    priority: true,
    status: true,
    dueDate: true,
    remarks: false, // Hidden by default to save space
    actions: true
  });

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
        const errorData = await response.json();
        alert(`Failed to save action item: ${errorData.error || 'Unknown error'}`);
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
          const errorData = await response.json();
          alert(`Failed to delete action item: ${errorData.error || 'Unknown error'}`);
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

  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const visibleColumnsCount = Object.values(columnVisibility).filter(Boolean).length;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Action Items ({actionItems.length})
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs font-medium">
                  Toggle Columns
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.serialNo}
                  onCheckedChange={() => toggleColumnVisibility('serialNo')}
                >
                  Serial No.
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.title}
                  onCheckedChange={() => toggleColumnVisibility('title')}
                >
                  Title & Description
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.assignedTo}
                  onCheckedChange={() => toggleColumnVisibility('assignedTo')}
                >
                  Assigned To
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.priority}
                  onCheckedChange={() => toggleColumnVisibility('priority')}
                >
                  Priority
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.status}
                  onCheckedChange={() => toggleColumnVisibility('status')}
                >
                  Status
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.dueDate}
                  onCheckedChange={() => toggleColumnVisibility('dueDate')}
                >
                  Due Date
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.remarks}
                  onCheckedChange={() => toggleColumnVisibility('remarks')}
                >
                  Remarks
                </DropdownMenuCheckboxItem>
                
                {!isReadOnly && (
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.actions}
                    onCheckedChange={() => toggleColumnVisibility('actions')}
                  >
                    Actions
                  </DropdownMenuCheckboxItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {!isReadOnly && (
              <Button onClick={addNewActionItem} size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Action Item
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {actionItems.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/30">
                    {columnVisibility.serialNo && (
                      <TableHead className="w-16 h-12 font-semibold">#</TableHead>
                    )}
                    {columnVisibility.title && (
                      <TableHead className="min-w-[300px] h-12 font-semibold">Title & Description</TableHead>
                    )}
                    {columnVisibility.assignedTo && (
                      <TableHead className="min-w-[160px] h-12 font-semibold">Assigned To</TableHead>
                    )}
                    {columnVisibility.priority && (
                      <TableHead className="w-28 h-12 font-semibold">Priority</TableHead>
                    )}
                    {columnVisibility.status && (
                      <TableHead className="w-32 h-12 font-semibold">Status</TableHead>
                    )}
                    {columnVisibility.dueDate && (
                      <TableHead className="w-36 h-12 font-semibold">Due Date</TableHead>
                    )}
                    {columnVisibility.remarks && (
                      <TableHead className="min-w-[200px] h-12 font-semibold">Remarks</TableHead>
                    )}
                    {!isReadOnly && columnVisibility.actions && (
                      <TableHead className="w-32 h-12 font-semibold">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionItems.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className={`border-b transition-colors hover:bg-muted/20 ${
                        item.status === 'Completed' ? 'bg-green-50/50' : ''
                      }`}
                    >
                      {columnVisibility.serialNo && (
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">{item.serialNo}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStatus(index)}
                              className="h-7 w-7 p-0 rounded-full hover:bg-primary/10"
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
                      )}
                      {columnVisibility.title && (
                        <TableCell className="py-4">
                          {isReadOnly ? (
                            <div className="space-y-2">
                              <div className="font-medium text-foreground leading-relaxed">{item.title}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Input
                                value={item.title}
                                onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                                placeholder="Action item title"
                                className="h-9"
                              />
                              <Textarea
                                value={item.description}
                                onChange={(e) => updateActionItem(index, 'description', e.target.value)}
                                placeholder="Description (optional)"
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>
                          )}
                        </TableCell>
                      )}

                      {columnVisibility.assignedTo && (
                        <TableCell className="py-4">
                          {isReadOnly ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                                {item.assignedToName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium">{item.assignedToName}</span>
                            </div>
                          ) : (
                            <Select 
                              value={item.assignedToId} 
                              onValueChange={(value) => updateActionItem(index, 'assignedToId', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select user" />
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
                          )}
                        </TableCell>
                      )}

                      {columnVisibility.priority && (
                        <TableCell className="py-4">
                          {isReadOnly ? (
                            <Badge className={`${PRIORITY_COLORS[item.priority]} px-3 py-1`}>
                              <Flag className="h-3 w-3 mr-1" />
                              {item.priority}
                            </Badge>
                          ) : (
                            <Select 
                              value={item.priority} 
                              onValueChange={(value) => updateActionItem(index, 'priority', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Low
                                  </div>
                                </SelectItem>
                                <SelectItem value="Medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    Medium
                                  </div>
                                </SelectItem>
                                <SelectItem value="High">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    High
                                  </div>
                                </SelectItem>
                                <SelectItem value="Critical">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Critical
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      )}

                      {columnVisibility.status && (
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Badge className={`${STATUS_COLORS[item.status]} px-3 py-1`}>
                              {item.status}
                            </Badge>
                            {!isReadOnly && item.status !== 'Completed' && (
                              <Select 
                                value={item.status} 
                                onValueChange={(value) => updateActionItem(index, 'status', value)}
                              >
                                <SelectTrigger className="h-9 w-32">
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
                      )}

                      {columnVisibility.dueDate && (
                        <TableCell className="py-4">
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
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                value={item.dueDate}
                                onChange={(e) => updateActionItem(index, 'dueDate', e.target.value)}
                                className="h-9"
                              />
                              {isOverdue(item.dueDate, item.status) && (
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}

                      {columnVisibility.remarks && (
                        <TableCell className="py-4">
                          {isReadOnly ? (
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {item.remarks || 'No remarks'}
                            </span>
                          ) : (
                            <Textarea
                              value={item.remarks}
                              onChange={(e) => updateActionItem(index, 'remarks', e.target.value)}
                              placeholder="Remarks (optional)"
                              rows={2}
                              className="text-sm resize-none"
                            />
                          )}
                        </TableCell>
                      )}

                      {!isReadOnly && columnVisibility.actions && (
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => saveActionItem(index)}
                              size="sm"
                              disabled={loading}
                              className="h-8 px-3"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => deleteActionItem(index)}
                              size="sm"
                              variant="destructive"
                              disabled={loading}
                              className="h-8 w-8 p-0"
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
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">No action items yet</p>
              <p className="text-sm text-muted-foreground">
                {!isReadOnly 
                  ? "Break down your task into actionable items to track progress" 
                  : "Action items will appear here when added"
                }
              </p>
            </div>
            {!isReadOnly && (
              <Button 
                onClick={addNewActionItem} 
                className="mt-6"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Action Item
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}