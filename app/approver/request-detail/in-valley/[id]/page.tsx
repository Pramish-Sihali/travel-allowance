import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import ApproverInValleyDetail from '@/components/dashboard/ApproverInValleyDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApproverInValleyDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="approver" />
      
      <main className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <ApproverInValleyDetail requestId={id} />
          </Suspense>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}