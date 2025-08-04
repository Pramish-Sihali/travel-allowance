import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: timeLogId } = await params;

    // Fetch comments for the time log
    const { data, error } = await supabaseAdmin
      .from('time_log_comments')
      .select('*')
      .eq('time_log_id', timeLogId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching time log comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const comments = data.map(comment => ({
      id: comment.id,
      timeLogId: comment.time_log_id,
      userId: comment.user_id,
      userName: comment.user_name,
      comment: comment.comment,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    }));

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error in time log comments GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: timeLogId } = await params;
    const body = await request.json();
    const { comment } = body;

    // Validate required fields
    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    // Check if time log exists
    const { data: timeLogData, error: timeLogError } = await supabaseAdmin
      .from('time_logs')
      .select('id')
      .eq('id', timeLogId)
      .single();

    if (timeLogError || !timeLogData) {
      return NextResponse.json(
        { error: 'Time log not found' },
        { status: 404 }
      );
    }

    // Insert comment
    const { data, error } = await supabaseAdmin
      .from('time_log_comments')
      .insert({
        time_log_id: timeLogId,
        user_id: session.user.id,
        user_name: session.user.name || session.user.email,
        comment: comment.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time log comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Transform response to camelCase
    const newComment = {
      id: data.id,
      timeLogId: data.time_log_id,
      userId: data.user_id,
      userName: data.user_name,
      comment: data.comment,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error in time log comments POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}