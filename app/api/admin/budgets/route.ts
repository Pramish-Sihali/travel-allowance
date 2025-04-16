// app/api/admin/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET all budgets
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budgets' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in budgets GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST a new budget
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 400 }
      );
    }

    // Set default values if not provided
    const amount = typeof body.amount === 'number' ? body.amount : 
                   typeof body.amount === 'string' ? parseFloat(body.amount) : 0;
    
    const fiscal_year = typeof body.fiscal_year === 'number' ? body.fiscal_year : 
                        typeof body.fiscal_year === 'string' ? parseInt(body.fiscal_year) : 
                        new Date().getFullYear();

    const budgetData = {
      project_id: body.project_id,
      amount: amount,
      fiscal_year: fiscal_year,
      description: body.description || ''
    };

    const { data, error } = await supabase
      .from('budgets')
      .insert([budgetData])
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return NextResponse.json(
        { error: 'Failed to create budget' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in budgets POST:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}