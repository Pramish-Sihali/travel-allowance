'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus,
  X, 
  Calendar,
  Check,
  AlertCircle,
  User,
  Flag,
  Trash2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
}

interface MeetingMinute {
  id?: string;
  serialNo: number;
  responsibility: string;
  assignedToId: string;
  assignedToName: string;
  deadline: string;
  remarks: string;
  isDone: boolean;
  flags: string;
  toggledBy?: string;
  toggledAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface MeetingMinutesTableProps {
  meetingMinutes: MeetingMinute[];
  onMinutesChange: (minutes: MeetingMinute[]) => void;
  isReadOnly?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

export default function MeetingMinutesTable({ 
  meetingMinutes, 
  onMinutesChange, 
  isReadOnly = false,
  currentUserId,
  currentUserName 
}: MeetingMinutesTableProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch users for assignment dropdown
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/employees');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const addNewMinute = () => {
    const newMinute: MeetingMinute = {
      serialNo: meetingMinutes.length + 1,
      responsibility: '',
      assignedToId: '',
      assignedToName: '',
      deadline: '',
      remarks: '',
      isDone: false,
      flags: '',
      createdBy: currentUserName || '',
      createdAt: new Date().toISOString()
    };
    onMinutesChange([...meetingMinutes, newMinute]);
  };

  const updateMinute = (index: number, field: keyof MeetingMinute, value: any) => {
    const updatedMinutes = [...meetingMinutes];
    
    if (field === 'assignedToId') {
      const selectedUser = users.find(user => user.id === value);
      updatedMinutes[index].assignedToId = value;
      updatedMinutes[index].assignedToName = selectedUser?.name || '';
    } else {
      (updatedMinutes[index] as any)[field] = value;
    }

    updatedMinutes[index].updatedBy = currentUserName || '';
    updatedMinutes[index].updatedAt = new Date().toISOString();

    onMinutesChange(updatedMinutes);
  };

  const toggleDoneStatus = (index: number) => {
    const updatedMinutes = [...meetingMinutes];
    updatedMinutes[index].isDone = !updatedMinutes[index].isDone;
    updatedMinutes[index].toggledBy = currentUserName || '';
    updatedMinutes[index].toggledAt = new Date().toISOString();
    updatedMinutes[index].updatedBy = currentUserName || '';
    updatedMinutes[index].updatedAt = new Date().toISOString();

    onMinutesChange(updatedMinutes);

    toast.success(`Task marked as ${updatedMinutes[index].isDone ? 'Done' : 'Not Done'} by ${currentUserName}`);
  };

  const removeMinute = (index: number) => {
    const updatedMinutes = meetingMinutes.filter((_, i) => i !== index);
    // Reorder serial numbers
    updatedMinutes.forEach((minute, i) => {
      minute.serialNo = i + 1;
    });
    onMinutesChange(updatedMinutes);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Meeting Minutes & Action Items</h3>
        {!isReadOnly && (
          <Button type="button" onClick={addNewMinute} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">S.No</TableHead>
              <TableHead className="min-w-[200px]">Responsibility/Action Item</TableHead>
              <TableHead className="min-w-[150px]">Assigned Person</TableHead>
              <TableHead className="w-32">Deadline</TableHead>
              <TableHead className="min-w-[150px]">Remarks</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="min-w-[100px]">Flags</TableHead>
              <TableHead className="w-24">Task</TableHead>
              {!isReadOnly && <TableHead className="w-16">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetingMinutes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 8 : 9} className="text-center py-8 text-muted-foreground">
                  No meeting minutes added yet. Click "Add Item" to start.
                </TableCell>
              </TableRow>
            ) : (
              meetingMinutes.map((minute, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{minute.serialNo}</TableCell>
                  
                  <TableCell>
                    {isReadOnly ? (
                      <div className="whitespace-pre-wrap">{minute.responsibility}</div>
                    ) : (
                      <Textarea
                        value={minute.responsibility}
                        onChange={(e) => updateMinute(index, 'responsibility', e.target.value)}
                        placeholder="Enter responsibility or action item..."
                        rows={2}
                        className="min-h-[60px]"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {isReadOnly ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {minute.assignedToName || 'Not assigned'}
                      </div>
                    ) : (
                      <Select
                        value={minute.assignedToId}
                        onValueChange={(value) => updateMinute(index, 'assignedToId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select person..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {isReadOnly ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {minute.deadline ? new Date(minute.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                    ) : (
                      <Input
                        type="date"
                        value={minute.deadline}
                        onChange={(e) => updateMinute(index, 'deadline', e.target.value)}
                        className="w-full"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {isReadOnly ? (
                      <div className="whitespace-pre-wrap">{minute.remarks}</div>
                    ) : (
                      <Textarea
                        value={minute.remarks}
                        onChange={(e) => updateMinute(index, 'remarks', e.target.value)}
                        placeholder="Enter remarks..."
                        rows={2}
                        className="min-h-[60px]"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant={minute.isDone ? "default" : "outline"}
                        size="sm"
                        onClick={() => !isReadOnly && toggleDoneStatus(index)}
                        className={`w-full ${minute.isDone ? 'bg-green-500 hover:bg-green-600' : 'text-red-600 border-red-300'}`}
                        disabled={isReadOnly}
                      >
                        {minute.isDone ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Not Done
                          </>
                        )}
                      </Button>
                      {minute.toggledBy && (
                        <div className="text-xs text-muted-foreground">
                          <div>By: {minute.toggledBy}</div>
                          <div>At: {formatDate(minute.toggledAt)}</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {isReadOnly ? (
                      <div className="flex flex-wrap gap-1">
                        {minute.flags.split(',').filter(flag => flag.trim()).map((flag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Flag className="h-3 w-3 mr-1" />
                            {flag.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Input
                        value={minute.flags}
                        onChange={(e) => updateMinute(index, 'flags', e.target.value)}
                        placeholder="Add flags (comma-separated)..."
                        className="w-full"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {minute.assignedToId && (
                      <Link href={`/tasks?assignedTo=${minute.assignedToId}`}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                  
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMinute(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {meetingMinutes.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Total Items: {meetingMinutes.length}</div>
          <div>Completed: {meetingMinutes.filter(m => m.isDone).length}</div>
          <div>Pending: {meetingMinutes.filter(m => !m.isDone).length}</div>
        </div>
      )}
    </div>
  );
}