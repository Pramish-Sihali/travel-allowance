// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET active budgets (public for checker and admin roles)
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
    
    console.log("Budgets API accessed by user:", session.user.email, "with role:", session.user.role);
    
    // Get project_id from query params if provided
    const projectId = request.nextUrl.searchParams.get('project_id');
    const fiscal_year = request.nextUrl.searchParams.get('fiscal_year');
    
    let query = supabase
      .from('budgets')
      .select('*');
    
    // Filter by project_id if provided
    if (projectId) {
      console.log("Filtering budgets by project_id:", projectId);
      query = query.eq('project_id', projectId);
    }
    
    // Filter by fiscal_year if provided
    if (fiscal_year) {
      console.log("Filtering budgets by fiscal_year:", fiscal_year);
      query = query.eq('fiscal_year', fiscal_year);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budgets' },
        { status: 500 }
      );
    }

    console.log("Budgets fetched successfully, count:", data?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in budgets GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST a budget update from checker (limited functionality)
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated as admin or checker
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'checker')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins and checkers can update budgets' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Budget update request received:", body);
    
    // Validate required fields
    if (!body.id || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Budget ID and amount are required' },
        { status: 400 }
      );
    }

    // Get the current budget
    const { data: currentBudget, error: getBudgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', body.id)
      .single();

    if (getBudgetError || !currentBudget) {
      console.error("Budget not found:", getBudgetError);
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    console.log("Current budget:", currentBudget, "New amount:", body.amount);

    // Update the budget
    const { data, error } = await supabase
      .from('budgets')
      .update({
        amount: body.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return NextResponse.json(
        { error: 'Failed to update budget' },
        { status: 500 }
      );
    }

    console.log("Budget updated successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in budget POST:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}