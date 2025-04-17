import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET in-valley expenses for a specific request
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');
  
  if (!requestId) {
    return NextResponse.json(
      { error: 'requestId is required' },
      { status: 400 }
    );
  }
  
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { data, error } = await supabase
      .from('valley_expenses')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching in-valley expenses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch in-valley expenses' },
        { status: 500 }
      );
    }
    
    // Convert snake_case to camelCase for frontend consistency
    const formattedData = data?.map(item => ({
      id: item.id,
      requestId: item.request_id,
      category: item.category,
      amount: item.amount,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
    
    return NextResponse.json(formattedData);
  } catch (error: unknown) {
    console.error('Error fetching in-valley expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch in-valley expenses: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST a new in-valley expense
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('In-valley expense body:', body);
    
    // Validate required fields
    if (!body.requestId || !body.category) {
      return NextResponse.json(
        { error: 'requestId and category are required' },
        { status: 400 }
      );
    }
    
    // Create the expense data - convert camelCase to snake_case for the database
    const expenseData = {
      id: uuidv4(),
      request_id: body.requestId,
      category: body.category,
      amount: body.amount || 0,
      description: body.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating in-valley expense:', expenseData);
    
    // Insert the expense into the database
    const { data, error } = await supabase
      .from('valley_expenses')
      .insert([expenseData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating in-valley expense:', error);
      return NextResponse.json(
        { error: `Failed to create in-valley expense: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Convert snake_case back to camelCase for frontend consistency
    const formattedData = {
      id: data.id,
      requestId: data.request_id,
      category: data.category,
      amount: data.amount,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return NextResponse.json(formattedData, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating in-valley expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create in-valley expense: ${errorMessage}` },
      { status: 400 }
    );
  }
}