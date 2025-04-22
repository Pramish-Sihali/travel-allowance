import { Suspense } from 'react';
import SettingsClient from './SettingsClient';
import Header from '@/components/layout/Header';

export default function SettingsPage() {
  return (
      <>
      
       <Header variant="admin" />
    <div className="p-6">
      {/* Fallback UI while client-side tab logic initializes */}
      <Suspense fallback={<p>Loading settings…</p>}>
        <SettingsClient />
      </Suspense>
    </div>
    <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Company Name. All rights reserved.</p>
      </footer>
      </>
  );
}
