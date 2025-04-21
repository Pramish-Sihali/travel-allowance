// app/api/users/by-ids/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUsersByIds } from '@/lib/db-helpers';

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
    
    // Get user IDs from query params
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.getAll('ids');
    
    if (!ids || ids.length === 0) {
      return NextResponse.json([]);
    }
    
    // Fetch users by their IDs
    const users = await getUsersByIds(ids);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}