import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/db';

export async function PATCH(req: NextRequest, context: { params: any; }) {
  const { params } = context as { params: Record<string, string> };
  try {
    const notification = await markNotificationAsRead(params.id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
