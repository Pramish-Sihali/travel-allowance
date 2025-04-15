// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { markNotificationAsRead } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // await the params promise to get your id
  const { id } = await params

  try {
    const notification = await markNotificationAsRead(id)
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
