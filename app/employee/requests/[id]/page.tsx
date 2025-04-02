import { Suspense } from 'react';
import EmployeeRequestDetail from '@/components/dashboard/EmployeeRequestDetail';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

export default function RequestDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Travel Allowance System</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, Employee</span>
            <Link href="/" className="text-sm underline">Logout</Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
         
          
          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <EmployeeRequestDetail requestId={params.id} />
          </Suspense>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}