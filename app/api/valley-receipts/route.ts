// app/api/valley-receipts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const expenseItemId = searchParams.get('expenseItemId');
    
    if (!expenseItemId) {
      return NextResponse.json(
        { error: 'expenseItemId is required' },
        { status: 400 }
      );
    }
    
    console.log('Fetching receipts for valley expense item:', expenseItemId);
    
    // Query the receipts table directly
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('expense_item_id', expenseItemId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching valley receipts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch receipts' },
        { status: 500 }
      );
    }
    
    // Transform the data to camelCase for consistent frontend usage
    const formattedData = data.map(receipt => ({
      id: receipt.id,
      expenseItemId: receipt.expense_item_id,
      originalFilename: receipt.original_filename,
      storedFilename: receipt.stored_filename,
      fileType: receipt.file_type,
      storagePath: receipt.storage_path,
      publicUrl: receipt.public_url,
      createdAt: receipt.created_at,
      requestType: receipt.request_type || 'in-valley'
    }));
    
    console.log(`Found ${formattedData.length} receipts for valley expense item: ${expenseItemId}`);
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching valley receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts', details: String(error) },
      { status: 500 }
    );
  }
}