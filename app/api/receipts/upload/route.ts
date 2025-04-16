// app/api/receipts/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createReceipt } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const expenseItemId = formData.get('expenseItemId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!expenseItemId) {
      return NextResponse.json(
        { error: 'No expenseItemId provided' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const storageFolder = 'receipts';
    const storagePath = `${storageFolder}/${uniqueFilename}`;
    
    // Convert file to arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('travel-expenses') // This is the bucket name - make sure it exists in Supabase
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }
    
    // Get public URL for the file
    const { data: publicUrlData } = supabase
      .storage
      .from('travel-expenses')
      .getPublicUrl(storagePath);
    
    const publicUrl = publicUrlData.publicUrl;
    
    // Save receipt record in database
    const receipt = await createReceipt({
      expenseItemId,
      originalFilename: file.name,
      storedFilename: uniqueFilename,
      fileType: file.type,
      storagePath: storagePath,
      publicUrl: publicUrl
    });
    
    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}