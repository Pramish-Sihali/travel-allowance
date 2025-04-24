// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET a specific project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated (any role can access this)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Allow empty ID case to return null for graceful handling
    if (!id) {
      return NextResponse.json(null);
    }

    console.log(`Fetching project details for ID: ${id}`);
    
    // Handle non-UUID format (may already be a project name)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      // Not a UUID format, likely already a name
      return NextResponse.json({ name: id });
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, active')
      .eq('id', id)
      .single();

    if (error) {
      // If it's a "not found" error, return null for graceful handling
      if (error.code === 'PGRST116') {
        console.log(`Project with ID ${id} not found`);
        return NextResponse.json(null);
      }
      
      console.error('Error fetching project details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project details' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in project GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}