// app/api/departments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Departments API - Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      console.log('Departments API - Auth failed - missing session or organizationId');
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('isactive', true)
      .eq('organizationid', session.user.organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    // Data is already in camelCase from database
    const departments = data.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      isActive: dept.isactive,
      createdAt: dept.createdat,
      updatedAt: dept.updatedat
    }));

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Exception in GET /api/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}