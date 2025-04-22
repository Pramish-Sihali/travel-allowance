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
    const requestType = formData.get('requestType') as string || 'travel'; // Default to travel if not specified
    
    console.log('Receipt upload request received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      expenseItemId,
      requestType
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
    const storageFolder = requestType === 'in-valley' ? 'valley-receipts' : 'receipts';
    const storagePath = `${storageFolder}/${uniqueFilename}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    console.log('Ready to upload to Supabase:', { 
      storagePath, 
      contentType: file.type,
      bufferLength: fileBuffer.length,
      storageFolder
    });
    
    // Upload to Supabase Storage
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
    
    try {
      // If it's an in-valley request, directly insert into the database
      if (requestType === 'in-valley') {
        // Insert receipt record for valley expense
        const receiptRecord = {
          id: uuidv4(),
          expense_item_id: expenseItemId,
          original_filename: file.name,
          stored_filename: uniqueFilename,
          file_type: file.type,
          storage_path: storagePath,
          public_url: publicUrl,
          created_at: new Date().toISOString(),
          request_type: 'in-valley'
        };
        
        console.log('Creating valley receipt record:', receiptRecord);
        
        const { data: valleyReceiptData, error: valleyReceiptError } = await supabase
          .from('receipts')
          .insert([receiptRecord])
          .select()
          .single();
        
        if (valleyReceiptError) {
          console.error('Error creating valley receipt record:', valleyReceiptError);
          return NextResponse.json(
            { error: `Failed to create receipt record: ${valleyReceiptError.message}` },
            { status: 500 }
          );
        }
        
        console.log('Valley receipt record created:', valleyReceiptData);
        
        return NextResponse.json({
          ...valleyReceiptData,
          requestType: 'in-valley'
        }, { status: 201 });
      } else {
        // For regular travel requests, use the existing createReceipt function
        const receipt = await createReceipt({
          expenseItemId,
          originalFilename: file.name,
          storedFilename: uniqueFilename,
          fileType: file.type,
          storagePath: storagePath,
          publicUrl: publicUrl
        });
        
        console.log('Travel receipt record created:', receipt);
        
        return NextResponse.json({
          ...receipt,
          requestType: 'travel'
        }, { status: 201 });
      }
    } catch (dbError) {
      console.error('Error creating receipt record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create receipt record', details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: String(error) },
      { status: 500 }
    );
  }
}