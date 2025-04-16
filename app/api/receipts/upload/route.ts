// app/api/receipts/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createReceipt } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/admin';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const expenseItemId = formData.get('expenseItemId') as string;
    
    console.log('Receipt upload request received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      expenseItemId 
    });
    
    if (!file) {
      console.error('No file provided in the form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!expenseItemId) {
      console.error('No expenseItemId provided in the form data');
      return NextResponse.json(
        { error: 'No expenseItemId provided' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const storageFolder = 'receipts';
    const storagePath = `${storageFolder}/${uniqueFilename}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    console.log('Ready to upload to Supabase:', { 
      storagePath, 
      contentType: file.type,
      bufferLength: fileBuffer.length 
    });
    
   // Then replace the upload with:
const { data: uploadData, error: uploadError } = await supabaseAdmin
.storage
.from('travel-expenses')
.upload(storagePath, fileBuffer, {
  contentType: file.type,
  upsert: true
});
    
if (uploadError) {
  console.error('Error uploading to Supabase Storage:', uploadError);
  
  // Check for RLS policy errors without using the statusCode property
  if (uploadError.message?.includes('row-level security policy') || 
      uploadError.message?.includes('Unauthorized') ||
      uploadError.message?.includes('403')) {
    return NextResponse.json(
      { 
        error: 'Supabase storage permission denied. You need to update your Row Level Security (RLS) policies.',
        details: uploadError
      },
      { status: 403 }
    );
  }
  
  return NextResponse.json(
    { error: `Failed to upload file: ${uploadError.message}` },
    { status: 500 }
  );
}
    
    console.log('File uploaded successfully:', uploadData);
    
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
    
    console.log('Receipt record created:', receipt);
    
    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: String(error) },
      { status: 500 }
    );
  }
}