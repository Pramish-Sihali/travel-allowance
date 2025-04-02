import { Suspense } from 'react';
import RequestDetail from '@/components/dashboard/RequestDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  // Await the params promise to get the actual parameters
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-green-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Travel Allowance System</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, Approver</span>
            <a href="/" className="text-sm underline">Logout</a>
          </div>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <RequestDetail requestId={id} />
          </Suspense>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}
