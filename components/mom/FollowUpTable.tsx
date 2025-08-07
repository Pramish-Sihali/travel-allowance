'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Check,
  AlertCircle,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface ActionItem {
  id: string;
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  responsibility: string;
  assigned_to_name: string;
  deadline: string;
  remarks: string;
  is_done: boolean;
  flags: string;
  toggled_by?: string;
  toggled_at?: string;
}

interface FollowUpTableProps {
  userId?: string;
  userName?: string;
}

export default function FollowUpTable({ userId, userName }: FollowUpTableProps) {
  const { toast } = useToast();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string>('');

  useEffect(() => {
    fetchAllActionItems();
  }, []);

  const fetchAllActionItems = async () => {
    setLoading(true);
    try {
      // First get all meetings with action items
      const meetingsResponse = await fetch('/api/meetings?employeeId=' + userId, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (!meetingsResponse.ok) {
        throw new Error('Failed to fetch meetings');
      }
      
      const meetingsData = await meetingsResponse.json();
      const meetings = meetingsData.meetings || [];
      
      // Filter meetings that have action items
      const meetingsWithActionItems = meetings.filter((m: any) => m.action_items_count > 0);
      
      // Fetch action items for each meeting
      const allActionItems: ActionItem[] = [];
      
      for (const meeting of meetingsWithActionItems) {
        const itemsResponse = await fetch(`/api/meetings/${meeting.id}/action-items`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        
        if (itemsResponse.ok) {
          const data = await itemsResponse.json();
          const items = (data.actionItems || []).map((item: any) => ({
            id: item.id,
            meeting_id: meeting.id,
            meeting_title: meeting.title,
            meeting_date: meeting.meeting_date,
            responsibility: item.responsibility || item.content,
            assigned_to_name: item.assigned_to_name || '',
            deadline: item.due_date || '',
            remarks: item.remarks || item.deadline_notes || '',
            is_done: item.is_done !== undefined ? item.is_done : (item.completion_status === 'completed'),
            flags: item.flags || (item.priority ? `Priority: ${item.priority}` : ''),
            toggled_by: item.toggled_by || item.completed_by_name,
            toggled_at: item.toggled_at || item.completed_at,
          }));
          allActionItems.push(...items);
        }
      }
      
      setActionItems(allActionItems);
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast.error('Failed to load action items');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (itemId: string, currentStatus: boolean) => {
    setUpdating(itemId);
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`/api/meetings/action-items/${itemId}`, {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          is_done: newStatus,
          toggled_by: userName || 'Follow-up Manager',
          toggled_at: new Date().toISOString(),
          completion_status: newStatus ? 'completed' : 'pending',
          completion_percentage: newStatus ? 100 : 0,
          completed_at: newStatus ? new Date().toISOString() : null,
          completed_by_name: newStatus ? (userName || 'Follow-up Manager') : null,
        }),
      });

      if (response.ok) {
        // Update local state
        setActionItems(prev => 
          prev.map(item => 
            item.id === itemId 
              ? { 
                  ...item, 
                  is_done: newStatus,
                  toggled_by: userName || 'Follow-up Manager',
                  toggled_at: new Date().toISOString(),
                }
              : item
          )
        );
        
        toast.success(`Action item marked as ${newStatus ? 'Done' : 'Not Done'}`);
      } else {
        toast.error('Failed to update action item status');
      }
    } catch (error) {
      console.error('Error updating action item:', error);
      toast.error('Failed to update action item status');
    } finally {
      setUpdating('');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const stats = {
    total: actionItems.length,
    completed: actionItems.filter(item => item.is_done).length,
    pending: actionItems.filter(item => !item.is_done).length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading action items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Follow-up Manager</h2>
          <p className="text-muted-foreground">
            {stats.total} total items • {stats.completed} completed • {stats.pending} pending
          </p>
        </div>
        <Button onClick={fetchAllActionItems} variant="outline" disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {actionItems.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Action Items Found</h3>
          <p className="text-muted-foreground">Create meetings with action items to see them here.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Status</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Responsibility/Action Item</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Button
                      type="button"
                      variant={item.is_done ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStatus(item.id, item.is_done)}
                      disabled={updating === item.id}
                      className={`w-full ${
                        item.is_done 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'text-red-600 border-red-300 hover:bg-red-50'
                      }`}
                    >
                      {updating === item.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : item.is_done ? (
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
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{item.meeting_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.meeting_date)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className={`${item.is_done ? 'line-through text-muted-foreground' : ''}`}>
                      {item.responsibility}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {item.assigned_to_name || 'Not assigned'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {item.deadline ? formatDate(item.deadline) : 'No deadline'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {item.remarks || '-'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.flags.split(',').filter(flag => flag.trim()).map((flag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {flag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {item.toggled_by && (
                      <div className="text-xs text-muted-foreground">
                        <div>By: {item.toggled_by}</div>
                        <div>{item.toggled_at ? formatDate(item.toggled_at) : ''}</div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}