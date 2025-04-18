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
    
    // Basic validation
    if (!body.email || !body.name || !body.role || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new user
    const newUser = await createUser(body);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

