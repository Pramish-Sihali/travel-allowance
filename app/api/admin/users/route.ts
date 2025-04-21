// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, updateUser, deleteUser } from '@/lib/db';
import { requireRole } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if the user is admin
    const user = await requireRole(["admin"]);
    
    // Get all users
    const users = await getAllUsers();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the user is admin
    const user = await requireRole(["admin"]);
    
    // Get request body
    const body = await request.json();
    
    // Log the incoming data to diagnose the issue
    console.log("User creation request body:", body);
    
    // Basic validation
    if (!body.email || !body.name || !body.role || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new user with correctly named fields
    // Make sure we're using 'designation' not 'position'
    const userData = {
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role,
      department: body.department,
      designation: body.designation // Ensure we use the right field name
    };
    
    console.log("Processed user data:", userData);
    
    // Create new user
    const newUser = await createUser(userData);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'details' in error ? (error as any).details : null;
    
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

