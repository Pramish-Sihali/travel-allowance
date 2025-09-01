// app/api/approvers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has organization
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization found' },
        { status: 401 }
      );
    }
    
    // Get approvers from same organization using Prisma
    const approvers = await prisma.user.findMany({
      where: {
        role: 'APPROVER',
        organizationId: session.user.organizationId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true
      }
    });
    
    // Transform to format needed by the form
    const approverOptions = approvers.map(approver => ({
      value: approver.id,
      label: approver.name || 'Unnamed Approver',
      email: approver.email,
      employeeId: approver.employeeId
    }));
    
    return NextResponse.json(approverOptions);
  } catch (error) {
    console.error('Error fetching approvers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvers' },
      { status: 500 }
    );
  }
}