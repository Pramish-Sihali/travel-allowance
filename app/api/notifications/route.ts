// app/api/notifications/route.ts - Updated version

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationsByUserId } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // If userId is not provided, use the current user's ID
    const targetUserId = userId || session.user.id;
    
    // For security, only allow users to fetch their own notifications
    // unless they are admins or checkers
    if (
      targetUserId !== session.user.id && 
      session.user.role !== 'admin' && 
      session.user.role !== 'checker'
    ) {
      return NextResponse.json(
        { error: 'You can only access your own notifications' },
        { status: 403 }
      );
    }
    
    // Get limit and offset parameters for pagination
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    
    console.log(`Fetching notifications for user ${targetUserId} with limit ${limit} and offset ${offset}`);
    
    try {
      // Use the library function if available
      const notifications = await getNotificationsByUserId(targetUserId);
      console.log(`Found ${notifications.length} notifications for user ${targetUserId}`);
      return NextResponse.json(notifications);
    } catch (dbError) {
      console.error('Error using library function, falling back to direct query:', dbError);
      
      // Fallback to direct query if library function fails
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching notifications from database:', error);
        return NextResponse.json(
          { error: 'Failed to fetch notifications' },
          { status: 500 }
        );
      }
      
      // Format data for frontend - convert snake_case to camelCase
      const formattedData = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        requestId: item.request_id,
        message: item.message,
        read: item.read,
        createdAt: item.created_at
      }));
      
      console.log(`Found ${formattedData.length} notifications for user ${targetUserId} using direct query`);
      return NextResponse.json(formattedData);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}