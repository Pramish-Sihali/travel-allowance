// app/api/admin/budgets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET a specific budget by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching budget:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budget' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in budget GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT (update) a specific budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    // Prepare data for update
    const amount = typeof body.amount === 'number' ? body.amount : 
                  typeof body.amount === 'string' ? parseFloat(body.amount) : 0;
    
    const fiscal_year = typeof body.fiscal_year === 'number' ? body.fiscal_year : 
                       typeof body.fiscal_year === 'string' ? parseInt(body.fiscal_year) : 
                       new Date().getFullYear();

    const updateData = {
      project_id: body.project_id,
      amount: amount,
      fiscal_year: fiscal_year,
      description: body.description || '',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return NextResponse.json(
        { error: 'Failed to update budget' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in budget PUT:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE a specific budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // First check if budget exists
    const { data: existingBudget, error: checkError } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Delete the budget
    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting budget:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete budget' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in budget DELETE:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}