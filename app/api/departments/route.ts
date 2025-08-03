// app/api/departments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    // Convert snake_case to camelCase for frontend
    const departments = data.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      isActive: dept.is_active,
      createdAt: dept.created_at,
      updatedAt: dept.updated_at
    }));

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Exception in GET /api/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}