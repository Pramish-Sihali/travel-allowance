import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Fetch all active clients for the organization
    let query = supabase
      .from('clients')
      .select('*')
      .eq('is_active', true);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organization_id', organizationId);
    } else {
      query = query.is('organization_id', null);
    }

    const { data: clients, error } = await query.order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    return NextResponse.json(clients || []);

  } catch (error) {
    console.error('Error in clients GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const data = await request.json();

    const {
      name,
      company,
      email,
      phone,
      client_type = 'new',
      contact_person,
      address,
      notes
    } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Client name is required' 
      }, { status: 400 });
    }

    // Create client record
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        client_type,
        contact_person: contact_person || null,
        address: address || null,
        notes: notes || null,
        organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      client,
      message: 'Client created successfully' 
    });

  } catch (error) {
    console.error('Error in clients POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}