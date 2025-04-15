// app/api/receipts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getReceiptsByExpenseItemId } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const expenseItemId = searchParams.get('expenseItemId');
  
  if (!expenseItemId) {
    return NextResponse.json(
      { error: 'expenseItemId is required' },
      { status: 400 }
    );
  }
  
  try {
    const receipts = await getReceiptsByExpenseItemId(expenseItemId);
    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}