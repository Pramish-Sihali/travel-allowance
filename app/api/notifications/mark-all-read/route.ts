import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all notifications as read for the current user
    const { error } = await supabase
      .from('notifications')
      .update({ isread: true })
      .eq('userid', session.user.id)
      .eq('isread', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark-all-read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}