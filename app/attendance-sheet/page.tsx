'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { User, AttendanceRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Download,
  ClipboardList,
  Filter,
  UserCheck
} from 'lucide-react';

interface EmployeeAttendance {
  employee: User;
  attendanceRecords: { [date: string]: AttendanceRecord | null };
}

interface MonthDateInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  isWeekend: boolean;
}

export default function AttendanceSheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
  const [monthDates, setMonthDates] = useState<MonthDateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/');
      return;
    }

    if (session.user.role !== 'approver') {
      toast.error("Access Denied: Only approvers can view the attendance sheet.");
      router.push('/');
      return;
    }

    fetchAttendanceSheet();
  }, [session, status, selectedMonth]);

  // Listen for attendance updates and refresh the sheet
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      console.log('Attendance updated, refreshing sheet...');
      fetchAttendanceSheet();
    };

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [selectedMonth]);

  const fetchAttendanceSheet = async () => {
    setLoading(true);
    try {
      // Single API call to fetch all attendance data for the month
      const response = await fetch(`/api/attendance-sheet?month=${selectedMonth}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance sheet');
      }
      
      const data = await response.json();
      
      // Update state with the fetched data
      setAttendanceData(data.employees || []);
      setMonthDates(data.monthDates || []);
      
      // Extract employees list for search functionality
      const employeesList = (data.employees || []).map((item: any) => item.employee).filter(Boolean);
      setEmployees(employeesList);
      
      console.log(`Loaded attendance sheet: ${data.totalEmployees} employees, ${data.totalRecords} records`);
      
    } catch (error) {
      console.error('Error fetching attendance sheet:', error);
      toast.error(error instanceof Error ? error.message : "Failed to load attendance sheet.");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (record: AttendanceRecord | null, isWeekend: boolean) => {
    if (isWeekend) return 'weekend';
    if (!record) return 'absent';
    
    if (record.status === 'leave') return 'leave';
    if (record.status === 'present') {
      // Check if they were late (after 9:30 AM)
      const attendanceTime = new Date(record.createdAt);
      const cutoffTime = new Date(record.date);
      cutoffTime.setHours(9, 30, 0, 0);
      
      return attendanceTime > cutoffTime ? 'late' : 'present';
    }
    
    return 'absent';
  };

  const getStatusCell = (record: AttendanceRecord | null, isWeekend: boolean) => {
    const status = getAttendanceStatus(record, isWeekend);
    
    if (isWeekend) {
      return (
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-xs text-gray-400">—</span>
        </div>
      );
    }

    const getStatusIcon = () => {
      switch (status) {
        case 'present':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'late':
          return <Clock className="w-4 h-4 text-yellow-600" />;
        case 'leave':
          return <UserCheck className="w-4 h-4 text-blue-600" />;
        case 'absent':
        default:
          return <XCircle className="w-4 h-4 text-red-600" />;
      }
    };

    const getStatusColor = () => {
      switch (status) {
        case 'present':
          return 'bg-green-100 hover:bg-green-200 border-green-300';
        case 'late':
          return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
        case 'leave':
          return 'bg-blue-100 hover:bg-blue-200 border-blue-300';
        case 'absent':
        default:
          return 'bg-red-100 hover:bg-red-200 border-red-300';
      }
    };

    const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
      <div
        className={`w-8 h-8 rounded border cursor-pointer transition-colors ${getStatusColor()}`}
        title={record ? `${status.toUpperCase()}: ${formatTime(record.createdAt)}${record.leaveReason ? ` - ${record.leaveReason}` : ''}` : 'Absent'}
      >
        <div className="w-full h-full flex items-center justify-center">
          {getStatusIcon()}
        </div>
      </div>
    );
  };

  const getEmployeeStats = (records: { [date: string]: AttendanceRecord | null }) => {
    const workDays = monthDates.filter(d => !d.isWeekend);
    let present = 0, late = 0, leave = 0, absent = 0;

    workDays.forEach(dateInfo => {
      const record = records[dateInfo.date];
      const status = getAttendanceStatus(record, dateInfo.isWeekend);
      
      switch (status) {
        case 'present': present++; break;
        case 'late': late++; break;
        case 'leave': leave++; break;
        case 'absent': absent++; break;
      }
    });

    return { present, late, leave, absent, workDays: workDays.length };
  };

  const filteredAttendance = attendanceData.filter(item => {
    // Skip if item or employee doesn't exist
    if (!item?.employee) return false;
    
    // If no search term, show all items
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const name = item.employee.name || '';
    const email = item.employee.email || '';
    const department = item.employee.department || '';
    
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) || 
           department.toLowerCase().includes(searchLower);
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading attendance sheet...</p>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role as 'employee' | 'approver' | 'checker' | 'admin' || 'employee';

  return (
    <div className="min-h-screen bg-background">
      <Header variant={userRole} />
      
      <div className="flex">
        <Sidebar userRole={userRole} />
        
        <main className={cn(
          "flex-1 transition-all duration-200",
          "md:ml-64",
          "p-6"
        )}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-lato">Attendance Sheet</h1>
                  <p className="text-muted-foreground font-nunito mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })} - Employee attendance tracking and management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchAttendanceSheet}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Leave</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Attendance Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left p-4 font-semibold min-w-48 sticky left-0 bg-gray-50 border-r">
                      Employee
                    </th>
                    {monthDates.map((dateInfo) => (
                      <th
                        key={dateInfo.date}
                        className={`text-center p-2 font-semibold min-w-12 ${
                          dateInfo.isWeekend ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="text-xs">
                          <div>{dateInfo.dayName}</div>
                          <div className="font-bold">{dateInfo.dayNumber}</div>
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-4 font-semibold min-w-32 bg-gray-50 border-l sticky right-0">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((item, index) => {
                    const stats = getEmployeeStats(item.attendanceRecords || {});
                    const attendanceRate = stats.workDays > 0 
                      ? Math.round(((stats.present + stats.late) / stats.workDays) * 100) 
                      : 0;

                    return (
                      <tr key={item.employee?.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-4 sticky left-0 bg-inherit border-r">
                          <div>
                            <div className="font-medium text-sm">{item.employee?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">
                              {item.employee?.department || 'Unknown'} • {item.employee?.email || 'No email'}
                            </div>
                          </div>
                        </td>
                        {monthDates.map((dateInfo) => (
                          <td key={dateInfo.date} className="p-2 text-center">
                            {getStatusCell(item.attendanceRecords?.[dateInfo.date], dateInfo.isWeekend)}
                          </td>
                        ))}
                        <td className="p-4 sticky right-0 bg-inherit border-l">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Rate:</span>
                              <span className="font-semibold">{attendanceRate}%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <div className="text-green-600">P: {stats.present}</div>
                              <div className="text-yellow-600">L: {stats.late}</div>
                              <div className="text-blue-600">Lv: {stats.leave}</div>
                              <div className="text-red-600">A: {stats.absent}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

            {filteredAttendance.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No employees found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}