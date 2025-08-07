import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: itemId } = await context.params;
    const organizationId = session.user.organizationId;
    const data = await request.json();

    const {
      completion_status,
      completion_percentage,
      completed_by,
      completed_at,
      deadline_notes,
      actual_hours,
      is_done,
      toggled_by,
      toggled_at,
      completed_by_name
    } = data;

    if (!itemId) {
      return NextResponse.json({ error: 'Action item ID is required' }, { status: 400 });
    }

    // First verify the action item exists and user has access
    let checkQuery = supabase
      .from('meeting_minutes')
      .select('id, meeting_id, organization_id')
      .eq('id', itemId);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      checkQuery = checkQuery.eq('organization_id', organizationId);
    } else {
      checkQuery = checkQuery.is('organization_id', null);
    }

    const { data: existingItem, error: checkError } = await checkQuery.single();

    if (checkError || !existingItem) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    // Get user name if completed_by is provided
    let completedByName = null;
    if (completed_by) {
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', completed_by)
        .single();
      
      completedByName = user?.name;
    }

    // Update the action item
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (completion_status !== undefined) {
      updateData.completion_status = completion_status;
    }

    if (completion_percentage !== undefined) {
      updateData.completion_percentage = completion_percentage;
    }

    if (completed_by !== undefined) {
      updateData.completed_by = completed_by;
      updateData.completed_by_name = completedByName;
    }

    if (completed_at !== undefined) {
      updateData.completed_at = completed_at;
    }

    if (deadline_notes !== undefined) {
      updateData.deadline_notes = deadline_notes;
    }

    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours;
    }

    if (is_done !== undefined) {
      updateData.is_done = is_done;
    }

    if (toggled_by !== undefined) {
      updateData.toggled_by = toggled_by;
    }

    if (toggled_at !== undefined) {
      updateData.toggled_at = toggled_at;
    }

    if (completed_by_name !== undefined) {
      updateData.completed_by_name = completed_by_name;
    }

    // Apply the update with proper organization filtering
    let updateQuery = supabase
      .from('meeting_minutes')
      .update(updateData)
      .eq('id', itemId);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      updateQuery = updateQuery.eq('organization_id', organizationId);
    } else {
      updateQuery = updateQuery.is('organization_id', null);
    }

    const { data: updatedItem, error: updateError } = await updateQuery
      .select()
      .single();

    if (updateError) {
      console.error('Error updating action item:', updateError);
      return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      actionItem: updatedItem,
      message: 'Action item updated successfully'
    });

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error in action-items PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}