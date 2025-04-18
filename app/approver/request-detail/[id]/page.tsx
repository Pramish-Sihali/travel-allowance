import { Suspense } from 'react';
import ApproverRequestDetail from '@/components/dashboard/ApproverRequestDetail';
import Header from '@/components/layout/Header';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  // Await the params promise to get the actual parameters
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="approver" />
      
      <main className="flex-grow p-6">
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
          <ApproverRequestDetail requestId={id} />
        </Suspense>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}