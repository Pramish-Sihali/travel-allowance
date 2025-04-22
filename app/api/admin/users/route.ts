// app/api/admin/users/route.ts with enhanced error handling
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/server/auth';
import { formatApiError, validateUserData, logRequestDetails } from '@/lib/api-helpers';

// A cache for the column names
let userColumns: string[] | null = null;

// Function to get the user table columns
async function getUserTableColumns() {
  if (userColumns) return userColumns;
  
  try {
    // Get a sample user to inspect columns
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Get the column names from the first user
      userColumns = Object.keys(data[0]);
      console.log("Detected user table columns:", userColumns);
      return userColumns;
    }
    
    console.log("No users found, cannot determine columns automatically");
    
    // Default to common column names if we can't detect
    return ['id', 'email', 'name', 'password', 'role', 'department', 'designation'];
  } catch (error) {
    console.error("Error detecting user columns:", error);
    // Default to common column names if we encounter an error
    return ['id', 'email', 'name', 'password', 'role', 'department', 'designation'];
  }
}

export async function GET(request: NextRequest) {
  try {
    logRequestDetails(request, { handler: 'GET users' });
    
    // Check if user is admin
    const user = await requireRole(["admin"]);
    
    // Get all users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      formatApiError(error, 'Failed to fetch users'),
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    logRequestDetails(request, { handler: 'POST users' });
    
    // Check if user is admin
    const user = await requireRole(["admin"]);
    
    // Get request body
    const body = await request.json();
    console.log("User creation request body:", body);
    
    // Validate the input
    const validationErrors = validateUserData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Get the actual column names from the database
    const columns = await getUserTableColumns();
    console.log("Using columns:", columns);
    
    // Create the user payload with correct field names
    const userPayload: Record<string, any> = {
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role
    };
    
    // Add department if column exists
    if (columns.includes('department') && body.department) {
      userPayload.department = body.department;
    }
    
    // For the position/designation field, check which column exists
    if (columns.includes('designation') && body.designation) {
      userPayload.designation = body.designation;
    } else if (columns.includes('position') && body.designation) {
      userPayload.position = body.designation;
    }
    
    console.log("Final user payload:", userPayload);
    
    // Insert the user with the appropriate fields
    const { data, error } = await supabase
      .from('users')
      .insert([userPayload])
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Check if it's a duplicate email error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('duplicate') && errorMessage.includes('email')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      formatApiError(error, 'Failed to create user'),
      { status: 500 }
    );
  }
}