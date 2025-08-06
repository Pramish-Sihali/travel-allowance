// app/api/users/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getEmployeesForGroupTravel } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forAttendance = searchParams.get('forAttendance');
    
    // If it's for attendance sheet, return all users from same organization (only for approvers)
    if (forAttendance === 'true') {
      if (session.user.role !== 'approver') {
        return NextResponse.json(
          { error: 'Access denied. Only approvers can view attendance sheet.' },
          { status: 403 }
        );
      }
      
      // Fetch all employees from same organization for attendance tracking
      const employees = await getEmployeesForGroupTravel(session.user.organizationId);
      return NextResponse.json(employees);
    }
    
    // For group travel, fetch employees from same organization excluding current user
    const employees = await getEmployeesForGroupTravel(session.user.organizationId);
    const filteredEmployees = employees.filter(emp => emp.id !== session.user.id);
    
    return NextResponse.json(filteredEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}