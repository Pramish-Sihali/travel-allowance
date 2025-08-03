// app/api/halls/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching halls:', error);
      return NextResponse.json({ error: 'Failed to fetch halls' }, { status: 500 });
    }

    // Convert snake_case to camelCase for frontend
    const halls = data.map(hall => ({
      id: hall.id,
      name: hall.name,
      capacity: hall.capacity,
      location: hall.location,
      amenities: hall.amenities,
      isActive: hall.is_active,
      createdAt: hall.created_at,
      updatedAt: hall.updated_at
    }));

    return NextResponse.json(halls);
  } catch (error) {
    console.error('Exception in GET /api/halls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}