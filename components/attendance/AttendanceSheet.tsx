'use client';

import { useState, useEffect } from 'react';
import { User, AttendanceRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface AttendanceSheetProps {
  approverId: string;
}

interface EmployeeAttendance {
  employee: User;
  todayAttendance: AttendanceRecord | null;
  status: 'present' | 'late' | 'absent' | 'leave';
  timestamp?: string;
}

export default function AttendanceSheet({ approverId }: AttendanceSheetProps) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceSheet();
  }, [selectedDate]);

  const fetchAttendanceSheet = async () => {
    setLoading(true);
    try {
      // Use optimized attendance sheet API
      const response = await fetch(`/api/attendance-sheet?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch attendance sheet');
      
      const data = await response.json();
      
      // Use data from optimized API
      setEmployees(data.employees);
      setAttendanceData(data.attendanceData);
    } catch (error) {
      console.error('Error fetching attendance sheet:', error);
      toast.error("Failed to load attendance sheet.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'leave':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'absent':
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Present</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Late</Badge>;
      case 'leave':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">On Leave</Badge>;
      case 'absent':
      default:
        return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAttendanceStats = () => {
    const present = attendanceData.filter(a => a.status === 'present').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const leave = attendanceData.filter(a => a.status === 'leave').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const total = attendanceData.length;

    return { present, late, leave, absent, total };
  };

  const filteredAttendance = attendanceData.filter(item =>
    item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users size={18} />
            Attendance Sheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 mb-2">
              <Users size={18} className="text-purple-600" />
              Attendance Sheet
            </CardTitle>
            <div className="flex gap-2 text-sm">
              <span className="text-green-600 font-medium">✓ {stats.present} Present</span>
              <span className="text-yellow-600 font-medium">⏰ {stats.late} Late</span>
              <span className="text-blue-600 font-medium">📅 {stats.leave} Leave</span>
              <span className="text-red-600 font-medium">✗ {stats.absent} Absent</span>
            </div>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={fetchAttendanceSheet}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>

          {/* Attendance List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredAttendance.map((item) => (
                <div
                  key={item.employee.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.status === 'present' ? 'bg-green-50 border-green-200' :
                    item.status === 'late' ? 'bg-yellow-50 border-yellow-200' :
                    item.status === 'leave' ? 'bg-blue-50 border-blue-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.employee.name}</span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.employee.department && (
                            <span>{item.employee.department} • </span>
                          )}
                          {item.employee.email}
                        </div>
                        {item.todayAttendance?.leaveReason && (
                          <div className="text-xs text-blue-700 mt-1">
                            <strong>Leave Reason:</strong> {item.todayAttendance.leaveReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.timestamp ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatTimestamp(item.timestamp)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          No record
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No employees found</p>
            </div>
          )}

          {/* Summary */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Employees:</span>
                <span className="font-medium ml-2">{stats.total}</span>
              </div>
              <div>
                <span className="text-gray-600">Attendance Rate:</span>
                <span className="font-medium ml-2">
                  {stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}