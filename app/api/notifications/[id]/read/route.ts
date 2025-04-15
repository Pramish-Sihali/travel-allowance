// app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { markNotificationAsRead } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  // Context must be typed as a Promise so we can await its `params`
  context: Promise<{ params: { id: string } }>
) {
  // Await the context to safely access params.id
  const { params } = await context
  const { id } = params

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
