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
  Cell,
  ComposedChart,
  Area
} from 'recharts';
import { 
  AlertTriangle,
  Check,
  DollarSign,
  Users,
  Building,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminStatisticsProps {
  stats: {
    totalUsers: number;
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalAmount: number;
    usersByRole: {
      employee: number;
      approver: number;
      checker: number;
      admin: number;
    };
    requestsByMonth: Array<{
      month: string;
      pending: number;
      approved: number;
      rejected: number;
      amount: number;
    }>;
    departmentData: Array<{
      name: string;
      requests: number;
      amount: number;
    }>;
    travelRequests?: number;
    valleyRequests?: number;
    pendingVerification?: number;
    projectStats?: Array<{
      name: string;
      requests: number;
      amount: number;
    }>;
  };
}

const colorPalette = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#6B7280',
  teal: '#14B8A6',
  amber: '#F59E0B'
};

const AdminStatistics: React.FC<AdminStatisticsProps> = ({ stats }) => {
  const [timeRange, setTimeRange] = useState('monthly');
  const [chartView, setChartView] = useState('combined');
  
  // Status distribution data
  const statusDistributionData = [
    { name: 'Pending', value: stats.pendingRequests, color: colorPalette.yellow },
    { name: 'Approved', value: stats.approvedRequests, color: colorPalette.green },
    { name: 'Rejected', value: stats.rejectedRequests, color: colorPalette.red },
    { name: 'Pending Verification', value: stats.pendingVerification || 0, color: colorPalette.purple }
  ].filter(item => item.value > 0);
  
  // User role distribution data
  const roleDistributionData = [
    { name: 'Employees', value: stats.usersByRole.employee, color: colorPalette.blue },
    { name: 'Approvers', value: stats.usersByRole.approver, color: colorPalette.purple },
    { name: 'Checkers', value: stats.usersByRole.checker, color: colorPalette.pink },
    { name: 'Admins', value: stats.usersByRole.admin, color: colorPalette.gray }
  ].filter(item => item.value > 0);
  
  // Request type distribution data
  const requestTypeData = [
    { name: 'Travel', value: stats.travelRequests || (stats.totalRequests * 0.7), color: colorPalette.indigo },
    { name: 'In-Valley', value: stats.valleyRequests || (stats.totalRequests * 0.3), color: colorPalette.teal }
  ].filter(item => item.value > 0);
  
  // Default to empty arrays if data isn't provided
  const monthlyRequestData = stats.requestsByMonth || [];
  const departmentData = stats.departmentData || [];
  const projectData = stats.projectStats || stats.departmentData || [];
  
  // Format currency for tooltips
  const formatCurrency = (value: number) => `Nrs.${value.toLocaleString()}`;
  
  // Prep monthly data for composed chart
  const getMonthlyData = () => {
    return monthlyRequestData.map(month => ({
      ...month,
      // Calculate total requests for the month
      total: month.pending + month.approved + month.rejected
    }));
  };
  
  // Custom tooltip for charts with currency
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.toLowerCase().includes('amount') 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-xl font-semibold">System Statistics</h3>
        <div className="flex flex-col sm:flex-row gap-3">
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
          
          <Tabs 
            value={chartView} 
            onValueChange={setChartView}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="combined">Combined</TabsTrigger>
              <TabsTrigger value="separate">Separate</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Summary Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Approved</p>
              <p className="text-2xl font-bold">{stats.approvedRequests}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Check className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Budget</p>
              <p className="text-lg font-bold">Nrs.{stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
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
              {chartView === 'combined' ? (
                <ComposedChart
                  data={getMonthlyData()}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="total" 
                    fill={colorPalette.blue} 
                    stroke={colorPalette.blue} 
                    fillOpacity={0.2} 
                    name="Total Requests"
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="pending" 
                    barSize={20} 
                    fill={colorPalette.yellow} 
                    name="Pending"
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="approved" 
                    barSize={20} 
                    fill={colorPalette.green} 
                    name="Approved"
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="rejected" 
                    barSize={20} 
                    fill={colorPalette.red} 
                    name="Rejected"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={colorPalette.purple} 
                    strokeWidth={2} 
                    name="Amount (Nrs)"
                  />
                </ComposedChart>
              ) : (
                <LineChart
                  data={monthlyRequestData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke={colorPalette.yellow} 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                    name="Pending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke={colorPalette.green} 
                    strokeWidth={2}
                    name="Approved"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rejected" 
                    stroke={colorPalette.red} 
                    strokeWidth={2}
                    name="Rejected"
                  />
                </LineChart>
              )}
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
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                  content={<CustomTooltip />}
                />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  name="Budget Amount" 
                  fill={colorPalette.purple}
                >
                  {monthlyRequestData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorPalette.purple} 
                      fillOpacity={0.7 + (0.3 * index / monthlyRequestData.length)}
                    />
                  ))}
                </Bar>
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
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Pending: {stats.pendingRequests}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                Verification: {stats.pendingVerification || 0}
              </Badge>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Approved: {stats.approvedRequests}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border-red-200">
                Rejected: {stats.rejectedRequests}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Request Type Distribution */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Request Type Distribution</CardTitle>
            <CardDescription>Travel vs. In-Valley Requests</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={requestTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {requestTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                Travel: {stats.travelRequests || '—'}
              </Badge>
              <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                In-Valley: {stats.valleyRequests || '—'}
              </Badge>
            </div>
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
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Department/Project Distribution */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {stats.projectStats ? 'Project Distribution' : 'Department Distribution'}
            </CardTitle>
            <CardDescription>
              {stats.projectStats 
                ? 'Request distribution by project' 
                : 'Request distribution by department'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.projectStats || departmentData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="requests" 
                  name="Number of Requests" 
                  fill={colorPalette.blue}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Department Analysis - Full Width */}
      <Card className="shadow-md">
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
              <YAxis yAxisId="left" orientation="left" stroke={colorPalette.blue} />
              <YAxis yAxisId="right" orientation="right" stroke={colorPalette.green} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="requests" 
                name="Number of Requests" 
                fill={colorPalette.blue} 
                barSize={30}
              />
              <Bar 
                yAxisId="right" 
                dataKey="amount" 
                name="Total Amount (Nrs.)" 
                fill={colorPalette.green}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatistics;