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
  
  const receipts = getReceiptsByExpenseItemId(expenseItemId);
  
  return NextResponse.json(receipts);
}