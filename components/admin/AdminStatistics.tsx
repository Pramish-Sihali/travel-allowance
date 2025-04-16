import React, { useState } from 'react';
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Bar, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

// Define the interface for the stats prop
interface AdminStatisticsProps {
  stats: {
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    usersByRole: {
      employee: number;
      approver: number;
      checker: number;
      admin: number;
    };
  };
}

const AdminStatistics: React.FC<AdminStatisticsProps> = ({ stats }) => {
  const [timeRange, setTimeRange] = useState('monthly');
  
  // Sample data for monthly travel requests
  const monthlyRequestData = [
    { month: 'Jan', pending: 4, approved: 9, rejected: 2, amount: 32000 },
    { month: 'Feb', pending: 3, approved: 8, rejected: 3, amount: 28000 },
    { month: 'Mar', pending: 5, approved: 12, rejected: 4, amount: 42000 },
    { month: 'Apr', pending: 4, approved: 7, rejected: 2, amount: 30000 },
    { month: 'May', pending: 3, approved: 9, rejected: 1, amount: 28000 },
    { month: 'Jun', pending: 6, approved: 10, rejected: 2, amount: 35000 },
  ];
  
  // Sample data for request status distribution
  const statusDistributionData = [
    { name: 'Pending', value: stats.pendingRequests, color: '#F59E0B' },
    { name: 'Approved', value: stats.approvedRequests, color: '#10B981' },
    { name: 'Rejected', value: stats.rejectedRequests, color: '#EF4444' }
  ];
  
  // Sample data for user role distribution
  const roleDistributionData = [
    { name: 'Employees', value: stats.usersByRole.employee, color: '#3B82F6' },
    { name: 'Approvers', value: stats.usersByRole.approver, color: '#8B5CF6' },
    { name: 'Checkers', value: stats.usersByRole.checker, color: '#EC4899' },
    { name: 'Admins', value: stats.usersByRole.admin, color: '#6B7280' }
  ];
  
  // Sample data for department distribution
  const departmentData = [
    { name: 'Engineering', requests: 45, amount: 90000 },
    { name: 'Marketing', requests: 30, amount: 60000 },
    { name: 'Finance', requests: 25, amount: 50000 },
    { name: 'HR', requests: 15, amount: 30000 },
    { name: 'Sales', requests: 20, amount: 40000 }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">System Statistics</h3>
        <Tabs 
          value={timeRange} 
          onValueChange={setTimeRange}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Trend Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Travel Request Trend</CardTitle>
            <CardDescription>Number of requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={monthlyRequestData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="approved" stroke="#10B981" />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Budget Utilization Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Utilization</CardTitle>
            <CardDescription>Expense amount by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyRequestData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`Nrs.${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Request Status Distribution */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Request Status Distribution</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Requests']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* User Role Distribution */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Role Distribution</CardTitle>
            <CardDescription>Users by role type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Users']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Department Distribution */}
        <Card className="shadow-md md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Department Analysis</CardTitle>
            <CardDescription>Request distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={departmentData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="requests" name="Number of Requests" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="amount" name="Total Amount (Nrs.)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStatistics;