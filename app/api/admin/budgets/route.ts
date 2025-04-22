// app/api/admin/budgets/route.ts - Updated to handle existing budgets

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET budgets with support for filtering
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
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const fiscalYear = url.searchParams.get('fiscal_year');
    
    console.log(`Fetching budgets with filters: projectId=${projectId}, fiscalYear=${fiscalYear}`);
    
    let query = supabase
      .from('budgets')
      .select('*');
    
    // Apply filters if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    if (fiscalYear) {
      query = query.eq('fiscal_year', fiscalYear);
    }
    
    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false });
    
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

// POST a new budget, or update existing if already exists for this project and fiscal year
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
    console.log("Budget creation/update request:", body);
    
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
    
    // Check if a budget already exists for this project and fiscal year
    const { data: existingBudget, error: checkError } = await supabase
      .from('budgets')
      .select('*')
      .eq('project_id', body.project_id)
      .eq('fiscal_year', fiscal_year)
      .maybeSingle(); // Returns null instead of error when no match
    
    if (checkError) {
      console.error('Error checking for existing budget:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing budget' },
        { status: 500 }
      );
    }
    
    // If an existing budget was found, update it instead of creating a new one
    if (existingBudget) {
      console.log(`Found existing budget for project ${body.project_id}, fiscal year ${fiscal_year}. Updating...`);
      
      const updateData = {
        amount: amount,
        description: body.description || existingBudget.description,
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedData, error: updateError } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', existingBudget.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating existing budget:', updateError);
        return NextResponse.json(
          { error: 'Failed to update budget' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        ...updatedData,
        message: 'Existing budget updated'
      });
    }
    
    // No existing budget found, create a new one
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