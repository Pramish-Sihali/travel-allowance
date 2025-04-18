import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import InValleyRequestForm from '@/components/forms/InValleyRequestForm';

export default function InValleyRequestPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="employee" />
      <main className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={<div className="text-center p-8">Loading form…</div>}>
            <InValleyRequestForm />
          </Suspense>
        </div>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}
