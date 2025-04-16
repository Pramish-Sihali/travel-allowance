// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET active projects (public for use in forms)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (any role can access this)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // By default, only fetch active projects
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
    
    let query = supabase
      .from('projects')
      .select('id, name, description, active');
    
    // If not explicitly including inactive projects, filter for active only
    if (!includeInactive) {
      query = query.eq('active', true);
    }
    
    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in projects GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}