// app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationsByUserId } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }
  
  const notifications = getNotificationsByUserId(userId);
  
  return NextResponse.json(notifications);
}