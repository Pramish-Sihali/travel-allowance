import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Update user name in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user name:', error);
      return NextResponse.json(
        { error: 'Failed to update name' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Error in update-name route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}