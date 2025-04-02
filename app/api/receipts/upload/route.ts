// app/api/receipts/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createReceipt } from '../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import path from 'path';

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
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // In a real app, you would use a cloud storage service
    // For this example, we'll save locally (but you shouldn't do this in production)
    const uniqueFilename = `${uuidv4()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, uniqueFilename);
    
    await writeFile(filePath, buffer);
    
    const receipt = createReceipt({
      expenseItemId,
      originalFilename: file.name,
      storedFilename: uniqueFilename,
      fileType: file.type,
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