// app/api/admin/users/[id]/route.ts with enhanced error handling
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/server/auth';
import { formatApiError, validateUserData, logRequestDetails } from '@/lib/api-helpers';

// A cache for the column names
let userColumns: string[] | null = null;

// Function to get the user table columns - same as in the POST route
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

// Check if a user exists
async function userExists(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .single();
  
  if (error || !data) return false;
  return true;
}

// GET a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logRequestDetails(request, { handler: 'GET user by ID', id: params.id });
    
    // Check if user is admin
    const adminUser = await requireRole(["admin"]);
    
    const { id } = params;
    console.log("Getting user with ID:", id);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET user:', error);
    
    return NextResponse.json(
      formatApiError(error, 'Failed to fetch user'),
      { status: 500 }
    );
  }
}

// PATCH (update) a specific user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logRequestDetails(request, { handler: 'PATCH user', id: params.id });
    
    // Check if user is admin
    const adminUser = await requireRole(["admin"]);
    
    const { id } = params;
    console.log("Updating user with ID:", id);
    
    // Check if user exists
    if (!(await userExists(id))) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the update data from request body
    const body = await request.json();
    console.log("Update user request body:", body);
    
    // Partial validation for update (only validate fields that are provided)
    const validationErrors = [];
    if (body.email !== undefined && !body.email) validationErrors.push('Email cannot be empty');
    if (body.name !== undefined && !body.name) validationErrors.push('Name cannot be empty');
    if (body.role !== undefined && !body.role) validationErrors.push('Role cannot be empty');
    
    // Basic email validation if provided
    if (body.email && !/\S+@\S+\.\S+/.test(body.email)) {
      validationErrors.push('Invalid email format');
    }
    
    // Role validation if provided
    const validRoles = ['admin', 'approver', 'checker', 'employee'];
    if (body.role && !validRoles.includes(body.role)) {
      validationErrors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Get the actual column names from the database
    const columns = await getUserTableColumns();
    console.log("Using columns for update:", columns);
    
    // Prepare the update data with correct field names
    const updateData: Record<string, any> = {};
    
    // Only include fields that are provided and exist in the database
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.password !== undefined) updateData.password = body.password;
    
    // Handle department field
    if (body.department !== undefined) {
      if (columns.includes('department')) {
        updateData.department = body.department;
      }
    }
    
    // Handle the designation/position field
    if (body.designation !== undefined) {
      if (columns.includes('designation')) {
        updateData.designation = body.designation;
      } else if (columns.includes('position')) {
        updateData.position = body.designation;
      }
    }
    
    console.log("Final update payload:", updateData);
    
    // Only proceed with update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update the user
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH user:', error);
    
    // Check if it's a duplicate email error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('duplicate') && errorMessage.includes('email')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      formatApiError(error, 'Failed to update user'),
      { status: 500 }
    );
  }
}

// DELETE a specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logRequestDetails(request, { handler: 'DELETE user', id: params.id });
    
    // Check if user is admin
    const adminUser = await requireRole(["admin"]);
    
    const { id } = params;
    console.log("Deleting user with ID:", id);
    
    // Check if user exists
    if (!(await userExists(id))) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is trying to delete themselves
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 403 }
      );
    }
    
    // Delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE user:', error);
    
    return NextResponse.json(
      formatApiError(error, 'Failed to delete user'),
      { status: 500 }
    );
  }
}