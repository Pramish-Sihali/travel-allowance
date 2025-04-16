// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllUsers, 
  getAllTravelRequests,
  getUsersByRole
} from '@/lib/db';
import { requireRole } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if the user is admin
    const user = await requireRole(["admin"]);
    
    // Get all users
    const users = await getAllUsers();
    
    // Get all travel requests
    const requests = await getAllTravelRequests();
    
    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      totalRequests: requests.length,
      pendingRequests: requests.filter(req => req.status === 'pending' || req.status === 'pending_verification').length,
      approvedRequests: requests.filter(req => req.status === 'approved').length,
      rejectedRequests: requests.filter(req => req.status === 'rejected' || req.status === 'rejected_by_checker').length,
      totalAmount: requests.reduce((sum, req) => sum + req.totalAmount, 0),
      usersByRole: {
        employee: users.filter(user => user.role === 'employee').length,
        approver: users.filter(user => user.role === 'approver').length,
        checker: users.filter(user => user.role === 'checker').length,
        admin: users.filter(user => user.role === 'admin').length
      },
      requestsByMonth: calculateRequestsByMonth(requests),
      departmentData: calculateDepartmentStats(requests)
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}

// Helper function to calculate monthly request data
function calculateRequestsByMonth(requests: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Get the last 6 months
  const relevantMonths = Array(6).fill(0).map((_, i) => {
    const monthIndex = (currentMonth - i + 12) % 12;
    return months[monthIndex];
  }).reverse();
  
  // Initialize data structure
  const monthlyData = relevantMonths.map(month => ({
    month,
    pending: 0,
    approved: 0,
    rejected: 0,
    amount: 0
  }));
  
  // Populate with actual data
  requests.forEach(request => {
    const requestDate = new Date(request.createdAt);
    const requestMonth = months[requestDate.getMonth()];
    const monthData = monthlyData.find(m => m.month === requestMonth);
    
    if (monthData) {
      if (request.status === 'pending' || request.status === 'pending_verification') {
        monthData.pending += 1;
      } else if (request.status === 'approved') {
        monthData.approved += 1;
      } else if (request.status === 'rejected' || request.status === 'rejected_by_checker') {
        monthData.rejected += 1;
      }
      
      monthData.amount += request.totalAmount;
    }
  });
  
  return monthlyData;
}

// Helper function to calculate department statistics
function calculateDepartmentStats(requests: any[]) {
  const departments: Record<string, { requests: number, amount: number }> = {};
  
  requests.forEach(request => {
    const dept = request.department || 'Unknown';
    
    if (!departments[dept]) {
      departments[dept] = { requests: 0, amount: 0 };
    }
    
    departments[dept].requests += 1;
    departments[dept].amount += request.totalAmount;
  });
  
  return Object.entries(departments).map(([name, data]) => ({
    name,
    requests: data.requests,
    amount: data.amount
  }));
}