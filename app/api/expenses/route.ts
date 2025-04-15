// app/api/expenses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createExpenseItem, getExpenseItemsByRequestId } from '@/lib/db';
import { ExpenseItem } from '@/types';

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
    const expenseItems = await getExpenseItemsByRequestId(requestId);
    return NextResponse.json(expenseItems);
  } catch (error) {
    console.error('Error fetching expense items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real app, validate the body data here
    
    const newExpenseItem = await createExpenseItem(body as Omit<ExpenseItem, 'id'>);
    
    return NextResponse.json(newExpenseItem, { status: 201 });
  } catch (error) {
    console.error('Error creating expense item:', error);
    return NextResponse.json(
      { error: 'Failed to create expense item' },
      { status: 400 }
    );
  }
}