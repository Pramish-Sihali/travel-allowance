// app/api/users/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getEmployeesForGroupTravel } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (any role can access this)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch employees for group travel
    const employees = await getEmployeesForGroupTravel();
    
    // Exclude the current user from the results
    // This prevents users from adding themselves to the group
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