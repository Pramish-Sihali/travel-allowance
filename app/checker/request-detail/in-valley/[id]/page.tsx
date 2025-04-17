import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import CheckerInValleyDetail from '@/components/dashboard/CheckerInValleyDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckerInValleyDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="checker" />
      
      <main className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <CheckerInValleyDetail requestId={id} />
          </Suspense>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}